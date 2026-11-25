import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Boutique Pro SaaS — Solution Industrielle de Gestion & Caisse POS',
  description: 'Logiciel SaaS multi-tenant pour la gestion de caisse, stocks, facturation certifiée et clôture comptable.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
