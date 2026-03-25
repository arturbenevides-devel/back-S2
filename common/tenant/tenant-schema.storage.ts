import { AsyncLocalStorage } from 'async_hooks';
import { InternalServerErrorException } from '@nestjs/common';

const storage = new AsyncLocalStorage<string>();

export function runWithTenantSchema<T>(schema: string, fn: () => Promise<T>): Promise<T> {
  return storage.run(schema, fn);
}

export function getTenantSchemaOrNull(): string | undefined {
  return storage.getStore();
}

export function getRequiredTenantSchema(): string {
  const s = storage.getStore();
  if (!s) {
    throw new InternalServerErrorException('Contexto do tenant não definido');
  }
  return s;
}
