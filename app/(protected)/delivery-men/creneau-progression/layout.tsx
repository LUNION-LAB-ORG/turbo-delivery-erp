'use client';

import React from 'react';

import HeaderCreneau from '@/components/dashboard/delivery-men/ceneau/header-creneau';
import { OngletsDeRoute } from '@/components/commons/OngletsDeRoute';

/* « PROGRESSEION DES BIRD » : la faute de frappe etait a l'ecran. */
const ONGLETS = [
  { exact: true, href: '/delivery-men/creneau-progression', libelle: 'Progression des birds' },
  {
    href: '/delivery-men/creneau-progression/turboys-assignes',
    libelle: 'Progression des turboys assignés',
  },
] as const;

export default function CreneauProgressionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <HeaderCreneau />
      <OngletsDeRoute onglets={ONGLETS} />
      {children}
    </div>
  );
}
