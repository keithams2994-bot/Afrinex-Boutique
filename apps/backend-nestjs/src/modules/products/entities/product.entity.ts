import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('products')
@Index(['tenantId', 'barcode'])
@Index(['tenantId', 'category'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, default: 'Général' })
  category: string;

  @Column({
    name: 'cost_price',
    type: 'numeric',
    precision: 15,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  costPrice: number;

  @Column({
    name: 'sale_price',
    type: 'numeric',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value) || 0,
    },
  })
  salePrice: number;

  @Column({ name: 'current_stock', type: 'int', default: 0 })
  currentStock: number;

  @Column({ name: 'alert_threshold', type: 'int', default: 5 })
  alertThreshold: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
