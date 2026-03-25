import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@common/database/persistence/prisma.service';
import { isValidCnpjDigits } from '@common/utils/cnpj.util';

@Injectable()
export class TenantPrismaRunner {
  constructor(private readonly prisma: PrismaService) {}

  quoteSchema(schema: string): string {
    if (!isValidCnpjDigits(schema)) {
      throw new BadRequestException('Identificador de tenant inválido');
    }
    return `"${schema.replace(/"/g, '""')}"`;
  }

  async run<T>(schema: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const q = this.quoteSchema(schema);
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO ${q}, public`);
      return fn(tx);
    });
  }
}
