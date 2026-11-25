import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PdfInvoiceService } from './pdf-invoice.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceItem])],
  controllers: [InvoicesController],
  providers: [InvoicesService, PdfInvoiceService],
  exports: [InvoicesService, PdfInvoiceService, TypeOrmModule],
})
export class InvoicesModule {}
