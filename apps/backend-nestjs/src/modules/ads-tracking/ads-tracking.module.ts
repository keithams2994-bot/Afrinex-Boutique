import { Module } from '@nestjs/common';
import { GoogleAdsConversionService } from './google-ads-conversion.service';

@Module({
  providers: [GoogleAdsConversionService],
  exports: [GoogleAdsConversionService],
})
export class AdsTrackingModule {}
