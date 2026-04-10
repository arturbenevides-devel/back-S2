import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantModule } from '@common/tenant/tenant.module';
import { JwtOrQueryAuthGuard } from '@common/http/guards/jwt-or-query-auth.guard';
import { WhatsappRepository } from './repositories/whatsapp.repository';
import { Whats2ApiService } from './services/whats2-api.service';
import { WhatsappService } from './services/whatsapp.service';
import { WhatsappEventsService } from './services/whatsapp-events.service';
import { WhatsappController } from './http/whatsapp.controller';
import { WhatsappWebhookController } from './http/whatsapp-webhook.controller';
import { WhatsappBootstrapService } from './whatsapp-bootstrap.service';

@Module({
  imports: [ConfigModule, TenantModule],
  controllers: [WhatsappController, WhatsappWebhookController],
  providers: [
    WhatsappRepository,
    Whats2ApiService,
    WhatsappEventsService,
    WhatsappService,
    WhatsappBootstrapService,
    JwtOrQueryAuthGuard,
  ],
  exports: [WhatsappService, Whats2ApiService],
})
export class WhatsappModule {}
