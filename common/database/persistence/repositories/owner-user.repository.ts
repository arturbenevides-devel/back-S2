import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OwnerUser } from '@common/domain/owner/entities/owner-user.entity';
import { OwnerUserRepository as IOwnerUserRepository } from '@common/domain/owner/repositories/owner-user.repository.interface';

interface OwnerRow {
  id: string;
  email: string;
  full_name: string;
  password: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

@Injectable()
export class OwnerUserRepositoryImpl implements IOwnerUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<OwnerUser | null> {
    const rows = await this.prisma.$queryRaw<OwnerRow[]>`
      SELECT id, email, full_name, password, is_active, created_at, updated_at
      FROM "public"."owner_users"
      WHERE email = ${email} AND is_active = true
      LIMIT 1
    `;
    return rows.length ? OwnerUser.fromDatabase(rows[0]) : null;
  }

  async findById(id: string): Promise<OwnerUser | null> {
    const rows = await this.prisma.$queryRaw<OwnerRow[]>`
      SELECT id, email, full_name, password, is_active, created_at, updated_at
      FROM "public"."owner_users"
      WHERE id = ${id} AND is_active = true
      LIMIT 1
    `;
    return rows.length ? OwnerUser.fromDatabase(rows[0]) : null;
  }

  async findAll(): Promise<OwnerUser[]> {
    const rows = await this.prisma.$queryRaw<OwnerRow[]>`
      SELECT id, email, full_name, password, is_active, created_at, updated_at
      FROM "public"."owner_users"
      ORDER BY created_at DESC
    `;
    return rows.map((r) => OwnerUser.fromDatabase(r));
  }

  async create(email: string, fullName: string, hashedPassword: string): Promise<OwnerUser> {
    const rows = await this.prisma.$queryRaw<OwnerRow[]>`
      INSERT INTO "public"."owner_users" (id, email, full_name, password, is_active, created_at)
      VALUES (gen_random_uuid(), ${email}, ${fullName}, ${hashedPassword}, true, NOW())
      RETURNING id, email, full_name, password, is_active, created_at, updated_at
    `;
    return OwnerUser.fromDatabase(rows[0]);
  }

  async updateIsActive(id: string, isActive: boolean): Promise<void> {
    await this.prisma.$queryRaw`
      UPDATE "public"."owner_users"
      SET is_active = ${isActive}, updated_at = NOW()
      WHERE id = ${id}
    `;
  }
}
