import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional } from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty({ message: "Le nom de l'entreprise est requis" })
  companyName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom du gérant est requis' })
  fullName: string;

  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit comporter au moins 8 caractères' })
  password: string;

  @IsString()
  @IsOptional()
  currency?: string = 'GNF';
}

export class LoginDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;
}

export class PinLoginDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @MinLength(4)
  pin: string;
}
