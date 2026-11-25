import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingController } from './billing.controller';
import { WhopService } from './whop.service';
import { LicenseTokenService } from './license-token.service';
import { LicenseKey } from './entities/license-key.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LicenseKey])],
  controllers: [BillingController],
  providers: [WhopService, LicenseTokenService],
  exports: [WhopService, LicenseTokenService, TypeOrmModule],
})
export class BillingModule {}
