import { Controller, Post, Headers, Req, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { DataSource } from 'typeorm';
import { WhopService } from './whop.service';
import { LicenseTokenService } from './license-token.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('billing')
export class BillingController {
  private stripe: Stripe;

  constructor(
    private readonly dataSource: DataSource,
    private readonly whopService: WhopService,
    private readonly licenseTokenService: LicenseTokenService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
      apiVersion: '2023-10-16',
    });
  }

  @Post('stripe-webhook')
  async handleStripeWebhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: Request,
  ) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = this.stripe.webhooks.constructEvent((req as any).rawBody, sig, webhookSecret);
      } else {
        event = req.body;
      }
    } catch (err: any) {
      throw new BadRequestException(`Signature Webhook Stripe Invalide: ${err.message}`);
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        if (tenantId) {
          await this.dataSource.query(
            `UPDATE tenants 
             SET subscription_status = 'ACTIVE', 
                 subscription_plan = 'PRO',
                 stripe_customer_id = $1, 
                 stripe_subscription_id = $2
             WHERE id = $3`,
            [session.customer, session.subscription, tenantId],
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.dataSource.query(
          `UPDATE tenants SET subscription_status = 'CANCELED' WHERE stripe_subscription_id = $1`,
          [sub.id],
        );
        break;
      }
    }

    return { received: true };
  }

  @Post('whop-webhook')
  async handleWhopWebhook(@Body() body: any) {
    return this.whopService.handleWebhook(body);
  }

  // Émission d'une clé de licence (Réservé au Super Admin SaaS ou Commercial Terrain)
  @Post('license/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async generateLicense(@Body() body: { plan?: string; durationDays?: number }) {
    return this.licenseTokenService.createAndSaveKey(body.plan, body.durationDays);
  }

  // Activation d'une licence par un commerçant
  @Post('license/redeem')
  @UseGuards(JwtAuthGuard)
  async redeemLicense(
    @CurrentTenant() tenantId: string,
    @Body('licenseKey') licenseKey: string,
  ) {
    return this.licenseTokenService.redeemKey(tenantId, licenseKey);
  }
}
