import React from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function SaasAdminDashboard() {
  // Données de pilotage en direct de la plateforme SaaS
  const metrics = {
    mrr: 14250,
    arr: 171000,
    activeTenants: 218,
    churnRate: 1.4,
    recentTenants: [
      { id: '1', name: 'Électro Conakry Central', plan: 'PRO', status: 'ACTIVE', joined: 'Aujourd\'hui' },
      { id: '2', name: 'Quincaillerie Moderne SARL', plan: 'ENTERPRISE', status: 'ACTIVE', joined: 'Hier' },
      { id: '3', name: 'Alimentation Générale Matam', plan: 'BASIC', status: 'TRIAL', joined: 'Il y a 2 jours' },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 mb-2">
              <ArrowLeft className="w-4 h-4" /> Retour Portail
            </Link>
            <h1 className="text-3xl font-black text-slate-900">Console de Supervision SaaS</h1>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full">
            Système en Ligne (Hostinger VPS)
          </span>
        </div>

        {/* Métriques Clés */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">MRR (Mensuel)</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">{metrics.mrr.toLocaleString()} €</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">+12.5% vs mois précédent</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">ARR (Annuel Projeté)</span>
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">{metrics.arr.toLocaleString()} €</div>
            <div className="text-xs text-blue-600 font-semibold mt-1">218 contrats abonnés</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Boutiques Actives</span>
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">{metrics.activeTenants}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">99.98% disponibilité</div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold tracking-wider">Taux d'Évaporation</span>
              <Activity className="w-5 h-5 text-rose-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">{metrics.churnRate} %</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">Excellente fidélisation</div>
          </div>
        </div>

        {/* Dernières Boutiques Enregistrées */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Dernières Entreprises Onboardées</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {metrics.recentTenants.map((t) => (
              <div key={t.id} className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Inscription : {t.joined}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-700">{t.plan}</span>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
