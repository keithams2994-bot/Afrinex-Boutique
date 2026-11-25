import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  findAll(@CurrentTenant() tenantId: string) {
    return this.usersService.findAll(tenantId);
  }

  @Post('agents')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createAgent(
    @CurrentTenant() tenantId: string,
    @Body() body: { fullName: string; email: string; pin: string },
  ) {
    return this.usersService.createAgent(tenantId, body);
  }

  @Put(':id/pin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updatePin(
    @CurrentTenant() tenantId: string,
    @Param('id') userId: string,
    @Body('pin') newPin: string,
  ) {
    return this.usersService.updatePin(tenantId, userId, newPin);
  }

  @Put(':id/toggle')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  toggleActive(@CurrentTenant() tenantId: string, @Param('id') userId: string) {
    return this.usersService.toggleActive(tenantId, userId);
  }
}
