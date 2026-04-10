import {
  Body,
  Controller,
  HttpCode,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from '../services/whatsapp.service';

@ApiTags('webhooks')
@Controller('webhooks/whats2')
export class WhatsappWebhookController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook público Whats2 (configure na API Whats2)' })
  async handle(
    @Body() body: Record<string, unknown>,
    @Query('token') token?: string,
  ): Promise<{ ok: boolean }> {
    const secret = this.config.get<string>('WHATS2_WEBHOOK_SECRET');
    if (secret && token !== secret) {
      throw new UnauthorizedException();
    }
    await this.whatsapp.handleWebhookPayload(body);
    return { ok: true };
  }
}
