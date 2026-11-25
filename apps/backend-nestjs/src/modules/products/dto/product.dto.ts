import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom du produit est requis' })
  name: string;

  @IsString()
  @IsOptional()
  category?: string = 'Général';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: "Le prix d'achat ne peut être négatif" })
  @Type(() => Number)
  costPrice: number = 0;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0, { message: 'Le prix de vente doit être supérieur ou égal à 0' })
  @Type(() => Number)
  salePrice: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  initialStock?: number = 0;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  alertThreshold?: number = 5;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  costPrice?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  alertThreshold?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
