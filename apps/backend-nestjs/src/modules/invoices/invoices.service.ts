import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { CreateInvoiceDto, SyncBatchInvoicesDto } from './dto/create-invoice.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private computeFiscalHash(
    prevHash: string,
    invoiceNumber: string,
    sequence: number,
    dateIso: string,
    totalTtc: number,
    tenantId: string,
  ): string {
    const raw = `${prevHash}|${invoiceNumber}|${sequence}|${dateIso}|${totalTtc.toFixed(2)}|${tenantId}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async createInvoice(tenantId: string, userId: string, dto: CreateInvoiceDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);

      // 1. Contrôle d'Idempotence (Essentiel pour la synchronisation hors-ligne)
      if (dto.clientUuid) {
        const [existing] = await queryRunner.query(
          `SELECT * FROM invoices WHERE tenant_id = $1 AND client_uuid = $2`,
          [tenantId, dto.clientUuid],
        );
        if (existing) {
          await queryRunner.rollbackTransaction();
          return existing; // Retourne la facture déjà enregistrée sans dupliquer
        }
      }

      // 2. Chaînage Cryptographique Inviolable (Norme NF525 / Anti-Fraude TVA)
      const lastInvoices = await queryRunner.query(
        `SELECT current_hash, sequence_number FROM invoices 
         WHERE tenant_id = $1 
         ORDER BY sequence_number DESC 
         LIMIT 1 FOR UPDATE`,
        [tenantId],
      );

      const prevHash = lastInvoices[0]?.current_hash || 'GENESIS_HASH_00000000000000000000000000000000000000000000000000000000';
      const nextSequence = (lastInvoices[0]?.sequence_number || 0) + 1;

      const year = new Date().getFullYear();
      const code = dto.type === 'FACTURE' ? 'FA' : (dto.type === 'TICKET' ? 'TK' : 'DOC');
      const invoiceNumber = `${code}-${year}-${String(nextSequence).padStart(5, '0')}`;

      // 3. Décrémentation atomique des stocks
      let totalHt = 0;
      const itemsToInsert = [];

      for (const item of dto.items) {
        const [product] = await queryRunner.query(
          `SELECT * FROM products WHERE id = $1 AND tenant_id = $2 FOR UPDATE`,
          [item.productId, tenantId],
        );

        if (!product) {
          throw new NotFoundException(`Produit ID ${item.productId} introuvable.`);
        }

        if (product.current_stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour "${product.name}". Disponible : ${product.current_stock}`,
          );
        }

        await queryRunner.query(
          `UPDATE products SET current_stock = current_stock - $1 WHERE id = $2`,
          [item.quantity, item.productId],
        );

        await queryRunner.query(
          `INSERT INTO stock_movements (tenant_id, product_id, user_id, quantity_delta, reason)
           VALUES ($1, $2, $3, $4, 'VENTE')`,
          [tenantId, item.productId, userId, -item.quantity],
        );

        const subtotal = Number(product.sale_price) * item.quantity;
        totalHt += subtotal;

        itemsToInsert.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.sale_price,
          costPrice: product.cost_price,
          quantity: item.quantity,
          subtotal,
        });
      }

      const taxRate = dto.isTaxExempt ? 0 : 0.18;
      const totalTax = totalHt * taxRate;
      const totalTtc = totalHt + totalTax;

      // 4. Calcul de l'Empreinte Fiscale Actuelle
      const dateIso = new Date().toISOString();
      const currentHash = this.computeFiscalHash(
        prevHash,
        invoiceNumber,
        nextSequence,
        dateIso,
        totalTtc,
        tenantId,
      );

      // 5. Insertion de la Facture
      const [invoice] = await queryRunner.query(
        `INSERT INTO invoices (
          tenant_id, user_id, client_id, invoice_number, sequence_number, type, status, 
          payment_method, total_ht, total_tax, total_ttc, notes, reference_invoice_id,
          previous_hash, current_hash, client_uuid, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
        [
          tenantId,
          userId,
          dto.clientId || null,
          invoiceNumber,
          nextSequence,
          dto.type,
          dto.status,
          dto.paymentMethod,
          totalHt,
          totalTax,
          totalTtc,
          dto.notes || null,
          dto.referenceInvoiceId || null,
          prevHash,
          currentHash,
          dto.clientUuid || null,
          dateIso,
        ],
      );

      for (const itm of itemsToInsert) {
        await queryRunner.query(
          `INSERT INTO invoice_items (
            tenant_id, invoice_id, product_id, product_name, unit_price, cost_price, quantity, subtotal
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            tenantId,
            invoice.id,
            itm.productId,
            itm.productName,
            itm.unitPrice,
            itm.costPrice,
            itm.quantity,
            itm.subtotal,
          ],
        );
      }

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('invoice.created', { tenantId, invoice, items: itemsToInsert });

      return invoice;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async syncBatch(tenantId: string, userId: string, dto: SyncBatchInvoicesDto) {
    const results = [];
    for (const invoiceDto of dto.invoices) {
      try {
        const synced = await this.createInvoice(tenantId, userId, invoiceDto);
        results.push({ status: 'SUCCESS', clientUuid: invoiceDto.clientUuid, invoice: synced });
      } catch (err: any) {
        results.push({ status: 'FAILED', clientUuid: invoiceDto.clientUuid, error: err.message });
      }
    }
    return {
      total: dto.invoices.length,
      syncedCount: results.filter((r) => r.status === 'SUCCESS').length,
      results,
    };
  }

  async findAll(tenantId: string, limit = 50) {
    return this.dataSource.query(
      `SELECT i.*, c.full_name as client_name, u.full_name as operator_name 
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN users u ON u.id = i.user_id
       WHERE i.tenant_id = $1
       ORDER BY i.sequence_number DESC
       LIMIT $2`,
      [tenantId, limit],
    );
  }

  async findOne(tenantId: string, id: string) {
    const [invoice] = await this.dataSource.query(
      `SELECT * FROM invoices WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    if (!invoice) throw new NotFoundException('Facture introuvable.');

    const items = await this.dataSource.query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );

    return { ...invoice, items };
  }
}
