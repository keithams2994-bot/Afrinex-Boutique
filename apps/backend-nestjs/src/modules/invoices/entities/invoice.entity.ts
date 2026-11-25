import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';

export enum InvoiceType {
  TICKET = 'TICKET',
  FACTURE = 'FACTURE',
  PROFORMA = 'PROFORMA',
  BON_COMMANDE = 'BON_COMMANDE',
  AVOIR = 'AVOIR',
}

export enum InvoiceStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  CREDIT = 'CREDIT',
  CANCELED = 'CANCELED',
}

@Entity('invoices')
@Index(['tenantId', 'invoiceNumber'])
@Index(['tenantId', 'sequenceNumber'])
@Index(['tenantId', 'createdAt'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'client_id', type: 'uuid', nullable: true })
  clientId: string;

  @Column({ name: 'invoice_number', type: 'varchar', length: 100 })
  invoiceNumber: string;

  @Column({ name: 'sequence_number', type: 'int' })
  sequenceNumber: number;

  @Column({
    type: 'enum',
    enum: InvoiceType,
    default: InvoiceType.FACTURE,
  })
  type: InvoiceType;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.PAID,
  })
  status: InvoiceStatus;

  @Column({ name: 'payment_method', type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({
    name: 'total_ht',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v) || 0,
    },
  })
  totalHt: number;

  @Column({
    name: 'total_tax',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v) || 0,
    },
  })
  totalTax: number;

  @Column({
    name: 'total_ttc',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v) || 0,
    },
  })
  totalTtc: number;

  @Column({ name: 'reference_invoice_id', type: 'uuid', nullable: true })
  referenceInvoiceId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // VERROU CRYPTOGRAPHIQUE NF525 / OHADA
  @Column({ name: 'previous_hash', type: 'varchar', length: 64 })
  previousHash: string;

  @Column({ name: 'current_hash', type: 'varchar', length: 64 })
  currentHash: string;

  // Clé d'idempotence pour la synchronisation hors-ligne
  @Column({ name: 'client_uuid', type: 'uuid', nullable: true })
  clientUuid: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
