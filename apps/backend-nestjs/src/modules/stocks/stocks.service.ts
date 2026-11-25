import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AdjustStockDto } from './dto/stock.dto';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';

@Injectable()
export class StocksService {
  constructor(private readonly dataSource: DataSource) {}

  async adjustStock(tenantId: string, userId: string, dto: AdjustStockDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = await queryRunner.manager
        .createQueryBuilder(Product, 'p')
        .setLock('pessimistic_write')
        .where('p.id = :id AND p.tenant_id = :tenantId', { id: dto.productId, tenantId })
        .getOne();

      if (!product) {
        throw new NotFoundException('Article introuvable dans ce catalogue.');
      }

      const newStock = product.currentStock + dto.quantityDelta;
      if (newStock < 0) {
        throw new BadRequestException(
          `Opération impossible : stock résultant négatif (${newStock}). Stock actuel : ${product.currentStock}`,
        );
      }

      product.currentStock = newStock;
      await queryRunner.manager.save(product);

      const movement = queryRunner.manager.create(StockMovement, {
        tenantId,
        productId: product.id,
        userId,
        quantityDelta: dto.quantityDelta,
        reason: dto.reason,
        notes: dto.notes,
      });
      await queryRunner.manager.save(movement);

      await queryRunner.commitTransaction();

      return {
        success: true,
        productId: product.id,
        productName: product.name,
        newStock: product.currentStock,
        alertThreshold: product.alertThreshold,
        isUnderThreshold: product.currentStock <= product.alertThreshold,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getMovements(tenantId: string, productId?: string, limit = 50) {
    const qb = this.dataSource
      .getRepository(StockMovement)
      .createQueryBuilder('sm')
      .leftJoinAndSelect('sm.product', 'p')
      .where('sm.tenant_id = :tenantId', { tenantId });

    if (productId) {
      qb.andWhere('sm.product_id = :productId', { productId });
    }

    return qb.orderBy('sm.created_at', 'DESC').take(limit).getMany();
  }

  async getLowStockAlerts(tenantId: string) {
    return this.dataSource
      .getRepository(Product)
      .createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.is_active = true')
      .andWhere('p.current_stock <= p.alert_threshold')
      .orderBy('p.current_stock', 'ASC')
      .getMany();
  }
}
