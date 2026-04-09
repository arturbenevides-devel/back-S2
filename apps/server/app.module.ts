import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { TenantModule } from '@common/tenant/tenant.module';
import { TenantSchemaInterceptor } from '@common/tenant/tenant-schema.interceptor';
import { UsersModule } from '@apps/core/application/users/users.module';
import { ProfilesModule } from '@apps/core/application/profiles/profiles.module';
import { ProfilePermissionsModule } from '@apps/core/application/profile-permissions/profile-permissions.module';
import { AuthModule } from '@apps/core/application/auth/auth.module';
import { MenusModule } from '@apps/core/application/menus/menus.module';
import { CompaniesModule } from '@apps/core/application/companies/companies.module';
import { OwnerModule } from '@apps/core/application/owner/owner.module';
import { TeamsModule } from '@apps/core/application/teams/teams.module';
import { WhatsappModule } from '@apps/core/application/whatsapp/whatsapp.module';
import { EmailModule } from '@common/email/email.module';
import { emailConfig } from '@common/email/email.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [emailConfig],
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '12h' },
    }),
    PrismaModule,
    TenantModule,
    UsersModule,
    ProfilesModule,
    ProfilePermissionsModule,
    AuthModule,
    MenusModule,
    CompaniesModule,
    OwnerModule,
    TeamsModule,
    WhatsappModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantSchemaInterceptor,
    },
  ],
})
export class AppModule {}






