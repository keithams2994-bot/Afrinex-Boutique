import { Module } from '@nestjs/common';
import { GhlWebhookService } from './ghl-webhook.service';

@Module({
  providers: [GhlWebhookService],
  exports: [GhlWebhookService],
})
export class IntegrationsModule {}
