import {
  Injectable,
  BadRequestException,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { isValidCnpjDigits } from '@common/utils/cnpj.util';
import { databaseUrlWithPostgresSchema } from '@common/utils/database-url.util';

@Injectable()
export class TenantPrismaRunner implements OnModuleDestroy {
  private readonly logger = new Logger(TenantPrismaRunner.name);
  private readonly baseUrl: string;
  private readonly clients = new Map<string, PrismaClient>();

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL não configurada');
    }
    this.baseUrl = url;
  }

  private getTenantClient(schema: string): PrismaClient {
    let client = this.clients.get(schema);
    if (!client) {
      client = new PrismaClient({
        datasources: {
          db: { url: databaseUrlWithPostgresSchema(this.baseUrl, schema) },
        },
      });
      this.clients.set(schema, client);
    }
    return client;
  }

  async run<T>(schema: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    if (!isValidCnpjDigits(schema)) {
      throw new BadRequestException('Identificador de tenant inválido');
    }
    return this.getTenantClient(schema).$transaction(fn);
  }

  async onModuleDestroy(): Promise<void> {
    const disconnects = [...this.clients.values()].map((c) =>
      c.$disconnect().catch((e) => this.logger.warn(e)),
    );
    await Promise.all(disconnects);
    this.clients.clear();
  }
}
