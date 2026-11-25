import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Expense } from './entities/expense.entity';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService, TypeOrmModule],
})
export class FinanceModule {}
