'use client';

import { OngletsDeRoute } from '@/components/commons/OngletsDeRoute';

const ONGLETS = [
  { exact: true, href: '/delivery-men', libelle: 'Tous' },
  { href: '/delivery-men/assigned', libelle: 'Assignés' },
  { href: '/delivery-men/birds', libelle: 'Birds' },
  { href: '/delivery-men/requests', libelle: "Demandes d'identification" },
  { href: '/delivery-men/turboys', libelle: 'Indépendants et journaliers' },
] as const;

export default function DeliveryMenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4 pb-10">
      {/* Le titre etait peint en ROUGE DE MARQUE. */}
      <h1 className="text-2xl font-bold text-foreground">Coursiers</h1>
      <OngletsDeRoute onglets={ONGLETS} />
      {children}
    </div>
  );
}
