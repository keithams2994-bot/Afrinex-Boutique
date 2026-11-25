import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Zap, BarChart3, Printer, Smartphone } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Barre de navigation */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏪</span>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Boutique Pro <span className="text-emerald-600">SaaS</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition">Fonctionnalités</a>
            <Link href="/pricing" className="hover:text-emerald-600 transition">Tarifs</Link>
            <a href="#security" className="hover:text-emerald-600 transition">Sécurité OHADA</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/pricing"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              Démarrer l'essai
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-8">
          <Zap className="w-4 h-4 text-emerald-600" /> Plateforme SaaS Prête pour la Production
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
          Pilotez votre commerce avec une rigueur <span className="text-emerald-600">industrielle</span>.
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
          La solution tout-en-un pour gérer vos points de vente, stocks, factures conformes OHADA, impression thermique Bluetooth et clôture de caisse quotidienne.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/pricing"
            className="bg-slate-900 hover:bg-slate-800 text-white text-base font-bold px-8 py-4 rounded-2xl shadow-md transition"
          >
            Découvrir les Plans SaaS
          </Link>
          <Link
            href="/admin"
            className="bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-base font-bold px-8 py-4 rounded-2xl shadow-sm transition"
          >
            Console Métriques SaaS
          </Link>
        </div>
      </section>

      {/* Points forts */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-6">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Impression ESC/POS Native</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Connectez directement votre imprimante Bluetooth 58mm ou 80mm sans pilotes complexes, avec découpe automatique et assainissement des caractères.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Isolation RLS Multi-Tenant</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Séparation matérielle et logique étanche au niveau du moteur PostgreSQL pour garantir la confidentialité absolue des comptes entre boutiques.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-slate-100 bg-slate-50/50">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Clôture Caisse & Rapprochement</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ventilation exacte entre Espèces, Orange Money, MTN et Wave. Contrôle strict de ce que chaque opérateur doit remettre en fin de journée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t text-center text-sm text-slate-500">
        <p>© 2026 Boutique Pro SaaS. Plateforme certifiée exploitation industrielle.</p>
      </footer>
    </div>
  );
}
