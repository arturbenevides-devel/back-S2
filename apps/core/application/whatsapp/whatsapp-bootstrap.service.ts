import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Whats2ApiService } from './services/whats2-api.service';

@Injectable()
export class WhatsappBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(WhatsappBootstrapService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly whats2: Whats2ApiService,
  ) {}

  async onModuleInit(): Promise<void> {
    const auto = this.config.get<string>('WHATS2_AUTO_REGISTER_WEBHOOK');
    if (auto !== 'true' && auto !== '1') return;
    const base = this.config.get<string>('WEBHOOK_PUBLIC_BASE_URL');
    if (!base?.trim()) {
      this.logger.warn('WHATS2_AUTO_REGISTER_WEBHOOK ativo mas WEBHOOK_PUBLIC_BASE_URL ausente');
      return;
    }
    const secret = this.config.get<string>('WHATS2_WEBHOOK_SECRET');
    try {
      await this.whats2.registerWebhook(base.trim(), secret);
    } catch (e) {
      this.logger.warn(`Falha ao registrar webhook Whats2: ${String(e)}`);
    }
  }
}
