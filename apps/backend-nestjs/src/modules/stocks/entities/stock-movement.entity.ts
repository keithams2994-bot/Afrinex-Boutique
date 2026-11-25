import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

export enum StockMovementReason {
  VENTE = 'VENTE',
  REASSORT = 'REASSORT',
  PERTE = 'PERTE',
  INVENTAIRE = 'INVENTAIRE',
  RETOUR_CLIENT = 'RETOUR_CLIENT',
}

@Entity('stock_movements')
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'createdAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'quantity_delta', type: 'int' })
  quantityDelta: number;

  @Column({
    type: 'enum',
    enum: StockMovementReason,
    default: StockMovementReason.VENTE,
  })
  reason: StockMovementReason;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
