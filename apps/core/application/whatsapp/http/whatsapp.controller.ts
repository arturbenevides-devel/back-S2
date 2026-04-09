import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Observable, interval, merge, map } from 'rxjs';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { JwtOrQueryAuthGuard } from '@common/http/guards/jwt-or-query-auth.guard';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';
import { WhatsappService } from '../services/whatsapp.service';
import { WhatsappEventsService } from '../services/whatsapp-events.service';
import { Whats2ApiService } from '../services/whats2-api.service';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

class CreateConversationDto {
  @Transform(({ value }) => {
    if (value === null || value === undefined) return value;
    return String(value).replace(/\D/g, '');
  })
  @IsString()
  @MinLength(10, {
    message: 'phone deve ter ao menos 10 dígitos (DDD + número)',
  })
  phone!: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : String(value).trim(),
  )
  @IsString()
  contactName?: string;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === null || value === undefined
      ? undefined
      : String(value).trim(),
  )
  @IsString()
  contact_name?: string;
}

class SendTextDto {
  @IsString()
  text!: string;
}

class SendMediaDto {
  @IsIn(['image', 'audio', 'video'])
  kind!: 'image' | 'audio' | 'video';

  @IsString()
  base64!: string;

  @IsString()
  mime_type!: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsString()
  filename?: string;
}

function reqUserId(req: Request): string {
  const u = (req as unknown as { user?: { sub?: string } }).user;
  if (!u?.sub) throw new UnauthorizedException();
  return u.sub;
}

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly events: WhatsappEventsService,
    private readonly whats2: Whats2ApiService,
  ) {}

  @Get('integration-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Status Whats2 + diagnóstico de webhook (entrega e mensagens recebidas)',
  })
  async integrationStatus() {
    return this.whats2.getIntegrationDiagnostics();
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar conversas vinculadas ao atendente logado' })
  async listConversations(@Req() req: Request) {
    const schema = getRequiredTenantSchema();
    return this.whatsapp.listConversations(schema, reqUserId(req));
  }

  @Get('conversations/pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar conversas pendentes (sem atendente atribuído)' })
  async listPendingConversations() {
    const schema = getRequiredTenantSchema();
    return this.whatsapp.listPendingConversations(schema);
  }

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Abrir conversa por número' })
  async createConversation(@Req() req: Request, @Body() body: CreateConversationDto) {
    const schema = getRequiredTenantSchema();
    return this.whatsapp.createConversation(schema, reqUserId(req), body);
  }

  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mensagens da conversa' })
  async getMessages(@Req() req: Request, @Param('id') id: string) {
    const schema = getRequiredTenantSchema();
    return this.whatsapp.getMessages(schema, id, reqUserId(req));
  }

  @Post('conversations/:id/messages/text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enviar texto' })
  async sendText(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: SendTextDto,
  ) {
    const schema = getRequiredTenantSchema();
    return this.whatsapp.sendText(schema, reqUserId(req), id, body.text);
  }

  @Post('conversations/:id/messages/media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enviar imagem, áudio ou vídeo (base64)' })
  async sendMedia(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: SendMediaDto,
  ) {
    const schema = getRequiredTenantSchema();
    return this.whatsapp.sendMedia(schema, reqUserId(req), id, body);
  }

  @Patch('conversations/:id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Assumir conversa pendente' })
  async claim(@Req() req: Request, @Param('id') id: string) {
    const schema = getRequiredTenantSchema();
    await this.whatsapp.claim(schema, id, reqUserId(req));
    return { ok: true };
  }

  @Patch('conversations/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Marcar como lida' })
  async read(@Req() req: Request, @Param('id') id: string) {
    const schema = getRequiredTenantSchema();
    await this.whatsapp.markRead(schema, id, reqUserId(req));
    return { ok: true };
  }

  @Sse('stream')
  @UseGuards(JwtOrQueryAuthGuard)
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('X-Accel-Buffering', 'no')
  @ApiOperation({ summary: 'SSE — eventos em tempo real (use ?access_token=JWT)' })
  stream(@Req() req: Request): Observable<{ data: string }> {
    const schema = getRequiredTenantSchema();
    const userId = reqUserId(req);
    const heartbeats = interval(25000).pipe(
      map(() => ({ data: JSON.stringify({ type: 'ping' }) })),
    );
    return merge(heartbeats, this.events.userStream(schema, userId));
  }
}
