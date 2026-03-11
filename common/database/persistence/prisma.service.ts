import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    // Configurar timezone para São Paulo
    await this.$executeRaw`SET timezone = 'America/Sao_Paulo'`;
  }
}



