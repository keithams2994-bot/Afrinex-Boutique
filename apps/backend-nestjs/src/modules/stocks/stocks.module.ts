import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { StocksService } from './stocks.service';
import { StocksController } from './stocks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Product])],
  controllers: [StocksController],
  providers: [StocksService],
  exports: [StocksService, TypeOrmModule],
})
export class StocksModule {}
