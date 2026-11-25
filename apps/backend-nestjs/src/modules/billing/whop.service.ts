import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import axios from 'axios';

@Injectable()
export class WhopService {
  private readonly logger = new Logger(WhopService.name);
  private readonly apiKey = process.env.WHOP_API_KEY;

  constructor(private readonly dataSource: DataSource) {}

  async validateMembership(membershipId: string): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('WHOP_API_KEY absente, validation simulée en mode développement.');
      return true;
    }

    try {
      const res = await axios.get(`https://api.whop.com/api/v2/memberships/${membershipId}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });

      const validStatuses = ['active', 'trialing'];
      return validStatuses.includes(res.data?.status);
    } catch (err: any) {
      this.logger.error(`Erreur vérification licence Whop: ${err.message}`);
      return false;
    }
  }

  async handleWebhook(event: any) {
    const { action, data } = event;
    const membershipId = data?.id;
    const userEmail = data?.user?.email;

    this.logger.log(`Événement Whop reçu : [${action}] pour ${userEmail}`);

    if (action === 'membership.went_valid' && userEmail) {
      await this.dataSource.query(
        `UPDATE tenants 
         SET subscription_status = 'ACTIVE', 
             subscription_plan = 'PRO',
             whop_membership_id = $1
         WHERE id IN (SELECT tenant_id FROM users WHERE email = $2)`,
        [membershipId, userEmail],
      );
    } else if (action === 'membership.went_invalid' && membershipId) {
      await this.dataSource.query(
        `UPDATE tenants 
         SET subscription_status = 'CANCELED'
         WHERE whop_membership_id = $1`,
        [membershipId],
      );
    }
    return { status: 'processed' };
  }
}
