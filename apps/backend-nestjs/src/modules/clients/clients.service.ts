import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto, UpdateClientDto, QueryClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async create(tenantId: string, dto: CreateClientDto): Promise<Client> {
    const client = this.clientRepo.create({ ...dto, tenantId });
    return this.clientRepo.save(client);
  }

  async findAll(tenantId: string, query: QueryClientDto) {
    const { search, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (search) {
      where.fullName = ILike(`%${search}%`);
    }

    const [items, total] = await this.clientRepo.findAndCount({
      where,
      order: { fullName: 'ASC' },
      skip,
      take: limit,
    });

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string): Promise<Client> {
    const client = await this.clientRepo.findOne({ where: { id, tenantId } });
    if (!client) throw new NotFoundException('Client introuvable.');
    return client;
  }

  async update(tenantId: string, id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(tenantId, id);
    Object.assign(client, dto);
    return this.clientRepo.save(client);
  }
}
