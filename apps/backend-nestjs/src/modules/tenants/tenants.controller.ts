import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getProfile(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getProfile(tenantId);
  }

  @Put('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateSettings(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.tenantsService.updateSettings(tenantId, body);
  }
}
