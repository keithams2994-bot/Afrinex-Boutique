import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto/client.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateClientDto) {
    return this.clientsService.create(tenantId, dto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryClientDto) {
    return this.clientsService.findAll(tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.clientsService.findOne(tenantId, id);
  }

  @Put(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.update(tenantId, id, dto);
  }
}
