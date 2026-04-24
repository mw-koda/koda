import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { WebhookService } from './webhook.service';

@Controller('webhook')
@ApiTags('Webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('github')
  @HttpCode(200)
  @ApiOperation({ summary: 'Handle GitHub webhooks' })
  async handleGithubWebhook(
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Req() req: Request,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing x-hub-signature-256 header');
    }

    if (!event) {
      throw new BadRequestException('Missing x-github-event header');
    }

    // req.rawBody is populated by the raw body middleware (see main.ts note below)
    const rawBody: Buffer = (req as Request & { rawBody: Buffer }).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body not available');
    }

    this.webhookService.validateSignature(rawBody, signature);

    const payload = req.body as Record<string, unknown>;
    await this.webhookService.handleEvent(event, payload);

    return { received: true };
  }
}
