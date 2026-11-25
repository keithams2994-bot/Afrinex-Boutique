import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType, InvoiceStatus } from '../entities/invoice.entity';

export class InvoiceLineItemDto {
  @IsUUID('4', { message: 'ID produit invalide' })
  productId: string;

  @IsNumber()
  @Min(1, { message: 'La quantité minimale est de 1' })
  @Type(() => Number)
  quantity: number;
}

export class CreateInvoiceDto {
  @IsUUID('4')
  @IsOptional()
  clientId?: string;

  @IsUUID('4')
  @IsOptional()
  clientUuid?: string; // UUID généré en local hors-ligne pour l'idempotence

  @IsEnum(InvoiceType)
  type: InvoiceType;

  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @IsString()
  @IsNotEmpty({ message: 'Le mode de règlement est obligatoire' })
  paymentMethod: string;

  @IsBoolean()
  @IsOptional()
  isTaxExempt?: boolean = false;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineItemDto)
  items: InvoiceLineItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID('4')
  @IsOptional()
  referenceInvoiceId?: string;
}

export class SyncBatchInvoicesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceDto)
  invoices: CreateInvoiceDto[];
}
