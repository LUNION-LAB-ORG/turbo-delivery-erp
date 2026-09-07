'use client';

import { OngletsDeRoute } from '@/components/commons/OngletsDeRoute';

const ONGLETS = [{ exact: true, href: '/analystics', libelle: 'Aperçu' }] as const;

export default function AnalysticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <OngletsDeRoute onglets={ONGLETS} />
      {children}
    </div>
  );
}
