import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async getProfile(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Entreprise introuvable.');
    return tenant;
  }

  async updateSettings(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.getProfile(tenantId);
    
    // Champs modifiables par l'administrateur
    if (data.name) tenant.name = data.name;
    if (data.currency) tenant.currency = data.currency;
    if (data.taxRate !== undefined) tenant.taxRate = data.taxRate;
    if (data.rccm !== undefined) tenant.rccm = data.rccm;
    if (data.nif !== undefined) tenant.nif = data.nif;
    if (data.address !== undefined) tenant.address = data.address;
    if (data.phone !== undefined) tenant.phone = data.phone;
    if (data.logoUrl !== undefined) tenant.logoUrl = data.logoUrl;

    return this.tenantRepo.save(tenant);
  }
}
