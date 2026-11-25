import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';

import { Tenant } from './modules/tenants/entities/tenant.entity';
import { User } from './modules/users/entities/user.entity';
import { Client } from './modules/clients/entities/client.entity';
import { Product } from './modules/products/entities/product.entity';
import { StockMovement } from './modules/stocks/entities/stock-movement.entity';
import { Invoice } from './modules/invoices/entities/invoice.entity';
import { InvoiceItem } from './modules/invoices/entities/invoice-item.entity';
import { Expense } from './modules/finance/entities/expense.entity';
import { LicenseKey } from './modules/billing/entities/license-key.entity';

import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProductsModule } from './modules/products/products.module';
import { StocksModule } from './modules/stocks/stocks.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { FinanceModule } from './modules/finance/finance.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdsTrackingModule } from './modules/ads-tracking/ads-tracking.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'saas_admin',
      password: process.env.DATABASE_PASSWORD || 'SecretMasterPass123!',
      database: process.env.DATABASE_NAME || 'saas_core_db',
      entities: [
        Tenant,
        User,
        Client,
        Product,
        StockMovement,
        Invoice,
        InvoiceItem,
        Expense,
        LicenseKey,
      ],
      synchronize: false,
      logging: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    TenantsModule,
    UsersModule,
    ClientsModule,
    ProductsModule,
    StocksModule,
    InvoicesModule,
    FinanceModule,
    BillingModule,
    AdsTrackingModule,
    IntegrationsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes('*');
  }
}
