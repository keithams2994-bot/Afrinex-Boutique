import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { stripeCustomerId } = await req.json();

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'Client ID requis' }, { status: 400 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/pricing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
