import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('expenses')
  createExpense(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { label: string; amount: number; paymentMethod: string; notes?: string },
  ) {
    return this.financeService.createExpense(tenantId, userId, body);
  }

  @Get('expenses')
  getExpenses(@CurrentTenant() tenantId: string, @Query('limit') limit?: number) {
    return this.financeService.getExpenses(tenantId, limit);
  }

  @Get('daily-register')
  getDailyRegister(@CurrentTenant() tenantId: string, @Query('date') date?: string) {
    return this.financeService.getDailyRegister(tenantId, date);
  }
}
