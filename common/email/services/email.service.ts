import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailTemplate {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesPath: string;

  constructor(private configService: ConfigService) {
    this.templatesPath = path.join(process.cwd(), 'common', 'email', 'templates');
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Usar variáveis de ambiente diretamente
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailSecure = process.env.EMAIL_SECURE === 'true';
    const emailFrom = process.env.EMAIL_FROM || emailUser;
    
    this.logger.log('🔍 Debug - Configuração de email:');
    this.logger.log(`EMAIL_USER: ${emailUser}`);
    this.logger.log(`EMAIL_PASS: ${emailPass ? '***configurado***' : 'não configurado'}`);
    this.logger.log(`EMAIL_HOST: ${emailHost}`);
    this.logger.log(`EMAIL_PORT: ${emailPort}`);
    this.logger.log(`EMAIL_FROM: ${emailFrom}`);
    
    if (!emailUser || !emailPass) {
      this.logger.warn('Configurações de email não encontradas. Serviço de email desabilitado.');
      this.logger.warn('Configure EMAIL_USER e EMAIL_PASS no arquivo .env');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      }
    });

    this.logger.log('Serviço de email inicializado com sucesso');
  }

  async sendEmail(emailData: EmailTemplate): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Serviço de email não configurado. Verifique as configurações EMAIL_USER e EMAIL_PASS no arquivo .env');
    }

    try {
      const html = await this.compileTemplate(emailData.template, emailData.context);
      
      const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
      const mailOptions = {
        from: emailFrom,
        to: emailData.to,
        subject: emailData.subject,
        html,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'Jornada de Vendas API',
          'Reply-To': emailFrom,
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email enviado com sucesso para ${emailData.to}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Erro ao enviar email para ${emailData.to}:`, error);
      throw new Error(`Falha ao enviar email: ${error.message}`);
    }
  }

  private async compileTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      return template(context);
    } catch (error) {
      this.logger.error(`Erro ao compilar template ${templateName}:`, error);
      throw new Error(`Template ${templateName} não encontrado ou inválido`);
    }
  }

  async sendWelcomeEmail(
    to: string,
    userName: string,
    confirmationToken: string,
    tenantCnpjDigits?: string,
  ): Promise<boolean> {
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    const path = `/activate/${confirmationToken}`;
    const query =
      tenantCnpjDigits && /^\d{14}$/.test(tenantCnpjDigits) ? `?cnpj=${tenantCnpjDigits}` : '';
    return this.sendEmail({
      to,
      subject: 'Bem-vindo ao Develcode Whitelabel',
      template: 'welcome',
      context: {
        userEmail: to,
        confirmationUrl: `${base}${path}${query}`,
      },
    });
  }
}



