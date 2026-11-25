import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('license_keys')
export class LicenseKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'license_key', type: 'varchar', length: 100, unique: true })
  @Index()
  licenseKey: string;

  @Column({ type: 'varchar', length: 50, default: 'PRO' })
  plan: string;

  @Column({ name: 'duration_days', type: 'int', default: 30 })
  durationDays: number;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string;

  @Column({ name: 'is_redeemed', type: 'boolean', default: false })
  isRedeemed: boolean;

  @Column({ name: 'redeemed_at', type: 'timestamptz', nullable: true })
  redeemedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  signature: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
