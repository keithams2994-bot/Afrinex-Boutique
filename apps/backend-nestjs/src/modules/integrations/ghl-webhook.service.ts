import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import axios from 'axios';

@Injectable()
export class GhlWebhookService {
  private readonly logger = new Logger(GhlWebhookService.name);

  @OnEvent('tenant.registered')
  async handleNewLead(payload: { tenantId: string; email: string; companyName: string }) {
    const url = process.env.GHL_LEAD_WEBHOOK_URL;
    if (!url) return;

    try {
      await axios.post(url, {
        type: 'NEW_SAAS_LEAD',
        email: payload.email,
        companyName: payload.companyName,
        tenantId: payload.tenantId,
        source: 'BOUTIQUE_PRO_PORTAL',
      });
      this.logger.log(`Webhook GoHighLevel transmis pour ${payload.email}`);
    } catch (err: any) {
      this.logger.error(`Erreur webhook GHL: ${err.message}`);
    }
  }

  @OnEvent('invoice.created')
  async handleInvoiceSync(payload: { tenantId: string; invoice: any }) {
    const url = process.env.GHL_INVOICE_WEBHOOK_URL;
    if (!url) return;

    try {
      await axios.post(url, {
        type: 'INVOICE_ISSUED',
        invoiceNumber: payload.invoice.invoice_number,
        totalTtc: payload.invoice.total_ttc,
        paymentMethod: payload.invoice.payment_method,
        tenantId: payload.tenantId,
      });
    } catch (err: any) {
      this.logger.error(`Erreur sync GHL facture: ${err.message}`);
    }
  }
}
