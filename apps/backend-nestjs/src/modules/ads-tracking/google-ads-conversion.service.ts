import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class GoogleAdsConversionService {
  private readonly logger = new Logger(GoogleAdsConversionService.name);

  @OnEvent('tenant.registered')
  async handleTenantRegistered(event: { tenantId: string; email: string }) {
    this.logger.log(`[Google Ads Event] Inscription enregistrée pour : ${event.email}`);
    // Préparation pour l'API REST Google Ads v16 Offline Conversion
  }

  @OnEvent('invoice.created')
  async handleInvoiceCreated(event: { tenantId: string; invoice: any }) {
    if (event.invoice?.status === 'PAID') {
      this.logger.log(`[Google Ads Conversion] Achat confirmé : ${event.invoice.invoice_number} (${event.invoice.total_ttc} GNF)`);
    }
  }
}
