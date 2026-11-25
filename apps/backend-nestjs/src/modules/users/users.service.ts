import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(tenantId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { tenantId },
      select: ['id', 'email', 'fullName', 'role', 'isActive', 'createdAt'],
      order: { fullName: 'ASC' },
    });
  }

  async createAgent(tenantId: string, data: { fullName: string; email: string; password?: string; pin: string }) {
    const existing = await this.userRepo.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Cet email est déjà attribué.');

    const defaultPassword = data.password || 'AgentPass2026!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    const pinCodeHash = await bcrypt.hash(data.pin, salt);

    const agent = this.userRepo.create({
      tenantId,
      email: data.email,
      fullName: data.fullName,
      passwordHash,
      pinCodeHash,
      role: UserRole.AGENT,
      isActive: true,
    });

    return this.userRepo.save(agent);
  }

  async updatePin(tenantId: string, userId: string, newPin: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    const salt = await bcrypt.genSalt(10);
    user.pinCodeHash = await bcrypt.hash(newPin, salt);
    await this.userRepo.save(user);

    return { success: true, message: 'Code PIN mis à jour avec succès.' };
  }

  async toggleActive(tenantId: string, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    user.isActive = !user.isActive;
    return this.userRepo.save(user);
  }
}
