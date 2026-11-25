'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowLeft, Loader2 } from 'lucide-react';

const PLANS = [
  {
    id: 'BASIC',
    name: 'Starter Monoposte',
    desc: 'Idéal pour une boutique unique désirant digitaliser ses ventes et son tiroir-caisse.',
    priceMonthly: 29,
    priceAnnual: 24,
    stripePriceId: 'price_starter_monthly_mock',
    features: [
      '1 Terminal Caisse (Mobile, PC ou Tablette)',
      'Impression thermique Bluetooth 58mm & 80mm',
      'Catalogue jusqu\'à 500 références',
      'Facturation certifiée avec TVA & NIF',
      'Journal des ventes et dépenses',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro Commerce Multi-Agents',
    desc: 'Pour les commerces à fort trafic nécessitant la gestion des opérateurs et alertes.',
    priceMonthly: 69,
    priceAnnual: 55,
    stripePriceId: 'price_pro_monthly_mock',
    popular: true,
    features: [
      'Jusqu\'à 5 Caissiers avec codes PIN individuels',
      'Catalogue articles illimité & lecture optique code-barres',
      'Suivi des créances et carnet de crédit client',
      'Rapprochement de caisse par opérateur',
      'Synchronisation des leads avec GoHighLevel',
      'Génération vectorielle PDF avec Sceau & Signature',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Réseau Multi-Dépôts',
    desc: 'Pour les chaînes de magasins, grossistes et entreprises avec gestion centralisée.',
    priceMonthly: 189,
    priceAnnual: 149,
    stripePriceId: 'price_enterprise_monthly_mock',
    features: [
      'Terminaux et opérateurs illimités',
      'Multi-dépôts et transferts inter-boutiques',
      'Gestion centralisée des accès par rôles avancés',
      'API Whop & Intégration ERP sur-mesure',
      'Support prioritaire 24/7 & sauvegardes redondées',
    ],
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: typeof PLANS[0]) => {
    setLoadingPlan(plan.id);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.stripePriceId,
          email: 'nouveau-client@boutique.com',
          companyName: 'Ma Boutique Pro',
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert("Session Stripe simulée en mode développement.");
      }
    } catch (err) {
      alert("Erreur lors de la redirection Stripe.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Tarifs prévisibles, rentabilité immédiate.
          </h1>
          <p className="mt-4 text-slate-600">
            Choisissez le forfait adapté à la dimension de votre point de vente. Essai gratuit de 14 jours sans engagement.
          </p>

          <div className="mt-8 inline-flex items-center gap-4 bg-white p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition ${
                !annual ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Facturation Mensuelle
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                annual ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Facturation Annuelle <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((p) => {
            const price = annual ? p.priceAnnual : p.priceMonthly;
            const isLoading = loadingPlan === p.id;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl p-8 border flex flex-col justify-between transition-all ${
                  p.popular
                    ? 'border-emerald-500 shadow-xl ring-2 ring-emerald-500/20 relative'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full">
                    Forfait le plus adopté
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 min-h-[32px]">{p.desc}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">{price} €</span>
                    <span className="text-sm font-semibold text-slate-500">/ mois</span>
                  </div>

                  <hr className="my-8 border-slate-100" />

                  <ul className="space-y-3.5 text-sm text-slate-600">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button
                    onClick={() => handleCheckout(p)}
                    disabled={isLoading}
                    className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                      p.popular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Souscrire maintenant'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
