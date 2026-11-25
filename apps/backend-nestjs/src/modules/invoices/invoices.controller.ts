import { Controller, Get, Post, Body, Param, Res, Query, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { PdfInvoiceService } from './pdf-invoice.service';
import { CreateInvoiceDto, SyncBatchInvoicesDto } from './dto/create-invoice.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfInvoiceService: PdfInvoiceService,
  ) {}

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.createInvoice(tenantId, userId, dto);
  }

  // Ingestion en lot idempotente lors du retour du réseau 4G/Wi-Fi
  @Post('sync-batch')
  syncBatch(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SyncBatchInvoicesDto,
  ) {
    return this.invoicesService.syncBatch(tenantId, userId, dto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query('limit') limit?: number) {
    return this.invoicesService.findAll(tenantId, limit);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.findOne(tenantId, id);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfInvoiceService.generateInvoicePdf(tenantId, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="facture_${id}.pdf"`);
    res.send(pdfBuffer);
  }
}
