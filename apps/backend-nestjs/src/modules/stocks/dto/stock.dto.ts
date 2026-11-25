import { IsUUID, IsNumber, IsEnum, IsString, IsOptional, NotEquals } from 'class-validator';
import { Type } from 'class-transformer';
import { StockMovementReason } from '../entities/stock-movement.entity';

export class AdjustStockDto {
  @IsUUID('4', { message: 'ID de produit invalide' })
  productId: string;

  @IsNumber()
  @NotEquals(0, { message: 'La quantité delta ne peut pas être 0' })
  @Type(() => Number)
  quantityDelta: number;

  @IsEnum(StockMovementReason, { message: 'Motif de mouvement invalide' })
  reason: StockMovementReason;

  @IsString()
  @IsOptional()
  notes?: string;
}
