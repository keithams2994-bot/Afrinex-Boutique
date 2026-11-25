import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { email, companyName, planId, priceId } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      // Mode simulation pour développement
      return NextResponse.json({
        checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin?mock_success=true`,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      customer_email: email,
      metadata: { planId, companyName },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/admin?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/pricing`,
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
