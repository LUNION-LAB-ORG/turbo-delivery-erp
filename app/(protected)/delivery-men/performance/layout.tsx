'use client';

import React from 'react';

import SectionHeaderRetour from '@/components/commons/section-header-retour';
import { OngletsDeRoute } from '@/components/commons/OngletsDeRoute';

/* Les libelles etaient ecrits en CAPITALES et sans accents : « PERFORMANCE DES TURBOYS
   ASSIGNES ». Les capitales se lisent plus lentement, et le lecteur d'ecran les epelle. */
const ONGLETS = [
  { exact: true, href: '/delivery-men/performance', libelle: 'Performance des birds' },
  {
    href: '/delivery-men/performance/turboys-assignes',
    libelle: 'Performance des turboys assignés',
  },
] as const;

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeaderRetour text="Performance" />
      <OngletsDeRoute onglets={ONGLETS} />
      {children}
    </div>
  );
}
