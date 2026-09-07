'use client';

import React from 'react';

import SectionHeader from '@/components/dashboard/slot/sectionHeader';
import { OngletsDeRoute } from '@/components/commons/OngletsDeRoute';

const ONGLETS = [
  { exact: true, href: '/delivery-men/slot', libelle: 'Flotte de turboys birds' },
  { href: '/delivery-men/slot/turboys-assignes', libelle: 'Flotte de turboys assignés' },
] as const;

export default function SlotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader />
      <OngletsDeRoute onglets={ONGLETS} />
      {children}
    </div>
  );
}
