import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
const PDFDocument = require('pdfkit');

@Injectable()
export class PdfInvoiceService {
  constructor(private readonly dataSource: DataSource) {}

  async generateInvoicePdf(tenantId: string, invoiceId: string): Promise<Buffer> {
    const [invoice] = await this.dataSource.query(
      `SELECT i.*, t.name as company_name, t.address as company_address,
              t.phone as company_phone, t.rccm, t.nif, t.currency,
              c.full_name as client_name, c.tax_id as client_nif, c.phone as client_phone
       FROM invoices i
       JOIN tenants t ON t.id = i.tenant_id
       LEFT JOIN clients c ON c.id = i.client_id
       WHERE i.id = $1 AND i.tenant_id = $2`,
      [invoiceId, tenantId],
    );

    if (!invoice) throw new NotFoundException('Facture introuvable.');

    const items = await this.dataSource.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 AND tenant_id = $2`,
      [invoiceId, tenantId],
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // En-tête de la Boutique
      doc
        .fillColor('#0F6B4C')
        .fontSize(20)
        .text((invoice.company_name || 'BOUTIQUE PRO').toUpperCase(), 40, 40, { bold: true })
        .fontSize(9)
        .fillColor('#444')
        .text(invoice.company_address || 'Adresse Siège Social', 40, 65)
        .text(`Tél : ${invoice.company_phone || 'N/A'} | NIF : ${invoice.nif || 'N/A'} | RCCM : ${invoice.rccm || 'N/A'}`);

      // Métadonnées Facture
      doc
        .fontSize(14)
        .fillColor('#15203c')
        .text(`${invoice.type} N° ${invoice.invoice_number}`, 350, 40, { align: 'right' })
        .fontSize(9)
        .fillColor('#666')
        .text(`Date : ${new Date(invoice.created_at).toLocaleDateString('fr-FR')}`, 350, 60, { align: 'right' })
        .text(`Mode de règlement : ${invoice.payment_method}`, 350, 75, { align: 'right' });

      doc.moveTo(40, 95).lineTo(555, 95).strokeColor('#0F6B4C').lineWidth(2).stroke();

      // Encart Client
      doc
        .rect(40, 105, 515, 45)
        .fillColor('#f8f9fa')
        .fill()
        .fillColor('#15203c')
        .fontSize(10)
        .text(`CLIENT : ${invoice.client_name || 'Client au comptant'}`, 50, 115, { bold: true })
        .fontSize(8)
        .fillColor('#666')
        .text(`Contact : ${invoice.client_phone || 'Non renseigné'} | NIF Client : ${invoice.client_nif || 'N/A'}`, 50, 130);

      // Tableau des Articles
      let y = 165;
      doc.rect(40, y, 515, 20).fillColor('#0F6B4C').fill();
      doc.fillColor('#fff').fontSize(9).text('Désignation', 45, y + 5);
      doc.text('Qté', 320, y + 5, { width: 40, align: 'center' });
      doc.text('Prix Unitaire', 380, y + 5, { width: 80, align: 'right' });
      doc.text('Total HT', 470, y + 5, { width: 80, align: 'right' });

      y += 20;
      doc.fillColor('#222');

      items.forEach((itm: any) => {
        doc.fontSize(8).text(itm.product_name, 45, y + 6);
        doc.text(itm.quantity.toString(), 320, y + 6, { width: 40, align: 'center' });
        doc.text(Number(itm.unit_price).toLocaleString('fr-FR'), 380, y + 6, { width: 80, align: 'right' });
        doc.text(Number(itm.subtotal).toLocaleString('fr-FR'), 470, y + 6, { width: 80, align: 'right' });
        doc.moveTo(40, y + 20).lineTo(555, y + 20).strokeColor('#eee').lineWidth(0.5).stroke();
        y += 20;
      });

      // Totaux Financiers
      y += 15;
      const currency = invoice.currency || 'GNF';
      doc.fontSize(9).text('Total Hors Taxe (HT) :', 360, y).text(`${Number(invoice.total_ht).toLocaleString('fr-FR')} ${currency}`, 470, y, { align: 'right' });
      doc.text('Taxe TVA (18%) :', 360, y + 15).text(`${Number(invoice.total_tax).toLocaleString('fr-FR')} ${currency}`, 470, y + 15, { align: 'right' });
      doc.fontSize(11).fillColor('#0F6B4C').text('NET À PAYER (TTC) :', 360, y + 32, { bold: true })
         .text(`${Number(invoice.total_ttc).toLocaleString('fr-FR')} ${currency}`, 470, y + 32, { bold: true, align: 'right' });

      // Tampon de validation
      doc.fontSize(8).fillColor('#777')
         .text('Arrêtée la présente facture à la somme ci-dessus spécifiée.', 40, y + 70)
         .text('Document légal certifié conforme - Système Boutique Pro SaaS', 40, 780, { align: 'center' });

      doc.end();
    });
  }
}
