import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom complet du client est obligatoire' })
  fullName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Adresse email invalide' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  taxId?: string;
}

export class UpdateClientDto extends CreateClientDto {}

export class QueryClientDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 20;
}
