import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { StocksService } from './stocks.service';
import { AdjustStockDto } from './dto/stock.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('stocks')
@UseGuards(JwtAuthGuard)
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post('adjust')
  adjust(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.stocksService.adjustStock(tenantId, userId, dto);
  }

  @Get('movements')
  getMovements(
    @CurrentTenant() tenantId: string,
    @Query('productId') productId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.stocksService.getMovements(tenantId, productId, limit);
  }

  @Get('alerts')
  getAlerts(@CurrentTenant() tenantId: string) {
    return this.stocksService.getLowStockAlerts(tenantId);
  }
}
