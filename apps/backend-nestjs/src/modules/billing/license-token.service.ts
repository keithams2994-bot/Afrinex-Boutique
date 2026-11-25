import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { LicenseKey } from './entities/license-key.entity';

@Injectable()
export class LicenseTokenService {
  private readonly logger = new Logger(LicenseTokenService.name);
  private readonly hmacSecret = process.env.JWT_SECRET || 'SuperSecretLicenseHmacKey2026!';

  constructor(private readonly dataSource: DataSource) {}

  generateLicenseKey(plan: string = 'PRO', durationDays: number = 30) {
    const randomBlock = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiryTimestamp = Date.now() + durationDays * 24 * 3600 * 1000;
    const payload = `${plan}|${durationDays}|${expiryTimestamp}|${randomBlock}`;
    const signature = crypto.createHmac('sha256', this.hmacSecret).update(payload).digest('hex').substring(0, 16).toUpperCase();
    
    // Format commercial : BP-<PLAN>-<RANDOM>-<SIGNATURE>
    const licenseKey = `BP-${plan}-${randomBlock}-${signature}`;

    return {
      licenseKey,
      plan,
      durationDays,
      signature,
    };
  }

  async createAndSaveKey(plan: string = 'PRO', durationDays: number = 30): Promise<LicenseKey> {
    const gen = this.generateLicenseKey(plan, durationDays);
    const repo = this.dataSource.getRepository(LicenseKey);

    const record = repo.create({
      licenseKey: gen.licenseKey,
      plan: gen.plan,
      durationDays: gen.durationDays,
      signature: gen.signature,
      isRedeemed: false,
    });

    return repo.save(record);
  }

  async redeemKey(tenantId: string, key: string) {
    const repo = this.dataSource.getRepository(LicenseKey);
    const license = await repo.findOne({ where: { licenseKey: key.trim().toUpperCase() } });

    if (!license) {
      throw new NotFoundException('Clé de licence invalide.');
    }

    if (license.isRedeemed) {
      throw new BadRequestException('Cette clé de licence a déjà été consommée.');
    }

    // Activer l'abonnement du tenant pour la durée spécifiée
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + license.durationDays * 24 * 3600 * 1000);

      await queryRunner.query(
        `UPDATE tenants 
         SET subscription_status = 'ACTIVE',
             subscription_plan = $1,
             subscription_expires_at = $2
         WHERE id = $3`,
        [license.plan, expiresAt.toISOString(), tenantId],
      );

      license.isRedeemed = true;
      license.redeemedAt = now;
      license.tenantId = tenantId;
      await queryRunner.manager.save(license);

      await queryRunner.commitTransaction();
      this.logger.log(`Licence activée avec succès pour le tenant ${tenantId} (${license.durationDays} jours)`);

      return {
        success: true,
        plan: license.plan,
        durationDays: license.durationDays,
        expiresAt,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
