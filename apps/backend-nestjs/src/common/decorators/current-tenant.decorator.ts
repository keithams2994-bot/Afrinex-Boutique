import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId || request.headers['x-tenant-id'];
    
    if (!tenantId) {
      throw new UnauthorizedException("Contexte d'entreprise (tenant_id) introuvable dans la requête.");
    }
    return tenantId;
  },
);
