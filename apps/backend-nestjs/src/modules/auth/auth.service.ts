import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/entities/user.entity';
import { Tenant, SubscriptionPlan, SubscriptionStatus } from '../tenants/entities/tenant.entity';
import { RegisterTenantDto, LoginDto, PinLoginDto } from './dto/auth.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async registerTenant(dto: RegisterTenantDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existingUser) {
        throw new ConflictException('Cette adresse email est déjà utilisée.');
      }

      const slug = dto.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .concat('-', Math.floor(1000 + Math.random() * 9000).toString());

      // 1. Création du Tenant
      const tenant = queryRunner.manager.create(Tenant, {
        name: dto.companyName,
        slug,
        currency: dto.currency || 'GNF',
        subscriptionPlan: SubscriptionPlan.FREE,
        subscriptionStatus: SubscriptionStatus.TRIAL,
      });
      const savedTenant = await queryRunner.manager.save(tenant);

      // 2. Création de l'Administrateur
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(dto.password, salt);

      const user = queryRunner.manager.create(User, {
        tenantId: savedTenant.id,
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      // Émission d'événement (Conversions Google Ads & CRM GoHighLevel)
      this.eventEmitter.emit('tenant.registered', {
        tenantId: savedTenant.id,
        email: savedUser.email,
        companyName: savedTenant.name,
      });

      return this.generateTokens(savedUser, savedTenant.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects ou compte suspendu.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    return this.generateTokens(user, user.tenantId);
  }

  async verifyOperatorPin(tenantId: string, dto: PinLoginDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.userId, tenantId, isActive: true },
    });

    if (!user || !user.pinCodeHash) {
      throw new UnauthorizedException('Opérateur introuvable ou PIN non défini.');
    }

    const isMatch = await bcrypt.compare(dto.pin, user.pinCodeHash);
    if (!isMatch) {
      throw new UnauthorizedException('Code PIN de caisse erroné.');
    }

    return {
      verified: true,
      operator: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  private generateTokens(user: User, tenantId: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenantId,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: tenantId,
      },
    };
  }
}
