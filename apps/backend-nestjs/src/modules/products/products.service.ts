import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { StockMovement, StockMovementReason } from '../stocks/entities/stock-movement.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateProductDto): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const product = this.productRepo.create({
        ...dto,
        tenantId,
        currentStock: dto.initialStock || 0,
      });

      const savedProduct = await queryRunner.manager.save(product);

      if (dto.initialStock && dto.initialStock > 0) {
        const movement = queryRunner.manager.create(StockMovement, {
          tenantId,
          productId: savedProduct.id,
          userId,
          quantityDelta: dto.initialStock,
          reason: StockMovementReason.INVENTAIRE,
          notes: 'Stock initial à la création',
        });
        await queryRunner.manager.save(movement);
      }

      await queryRunner.commitTransaction();
      return savedProduct;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(tenantId: string, search?: string, category?: string, lowStockOnly?: boolean) {
    const qb = this.productRepo.createQueryBuilder('p')
      .where('p.tenant_id = :tenantId', { tenantId })
      .andWhere('p.is_active = true');

    if (search) {
      qb.andWhere('(p.name ILIKE :s OR p.barcode = :b)', { s: `%${search}%`, b: search });
    }

    if (category && category !== 'Tous') {
      qb.andWhere('p.category = :category', { category });
    }

    if (lowStockOnly) {
      qb.andWhere('p.current_stock <= p.alert_threshold');
    }

    return qb.orderBy('p.name', 'ASC').getMany();
  }

  async findOne(tenantId: string, id: string): Promise<Product> {
    const p = await this.productRepo.findOne({ where: { id, tenantId } });
    if (!p) throw new NotFoundException('Article introuvable.');
    return p;
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(tenantId, id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }
}
