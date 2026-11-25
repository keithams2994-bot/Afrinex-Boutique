import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

export interface TenantRequest extends Request {
  tenantId?: string;
  user?: any;
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string);

    if (tenantId) {
      req.tenantId = tenantId;

      // Injection de la variable de session locale RLS
      const queryRunner = this.dataSource.createQueryRunner();
      try {
        await queryRunner.connect();
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${tenantId.replace(/'/g, "''")}'`
        );
      } catch (_) {
        // Continue même si l'initialisation RLS échoue pour les routes sans DB
      } finally {
        await queryRunner.release();
      }
    }
    next();
  }
}
