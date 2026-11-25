import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterTenantDto, LoginDto, PinLoginDto } from './dto/auth.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-pin')
  @UseGuards(JwtAuthGuard)
  verifyPin(@CurrentTenant() tenantId: string, @Body() dto: PinLoginDto) {
    return this.authService.verifyOperatorPin(tenantId, dto);
  }
}
