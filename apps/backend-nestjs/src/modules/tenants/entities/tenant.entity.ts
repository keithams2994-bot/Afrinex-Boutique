import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 10, default: 'GNF' })
  currency: string;

  @Column({
    name: 'tax_rate',
    type: 'numeric',
    precision: 5,
    scale: 4,
    default: 0.18,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v) || 0.18,
    },
  })
  taxRate: number;

  @Column({
    name: 'subscription_plan',
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan: SubscriptionPlan;

  @Column({
    name: 'subscription_status',
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  subscriptionStatus: SubscriptionStatus;

  @Column({ name: 'stripe_customer_id', type: 'varchar', nullable: true })
  stripeCustomerId: string;

  @Column({ name: 'stripe_subscription_id', type: 'varchar', nullable: true })
  stripeSubscriptionId: string;

  @Column({ name: 'whop_membership_id', type: 'varchar', nullable: true })
  whopMembershipId: string;

  @Column({ name: 'rccm', type: 'varchar', nullable: true })
  rccm: string;

  @Column({ name: 'nif', type: 'varchar', nullable: true })
  nif: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address: string;

  @Column({ name: 'phone', type: 'varchar', nullable: true })
  phone: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
