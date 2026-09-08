'use client';

import React from 'react';

import { DetailContent } from '@/app/(protected)/analystics/pay-slip/[id]/details/content';
import { SearchBar } from '@/components/commons/form/search-bar';
import { SearchField } from '@/components/commons/form/search-field';
import { CalendarInput } from '@/components/components-finance/block/dateInput';
import { YearFilter } from '@/features/finance-dashboard/components/year-filter';

const LIGNES = [
  {
    authentif: 'Oui',
    coutCommande: '2500 Fcfa',
    coutLivraison: '1500 Fcfa',
    dateHeure: '2022-01-01 2h:30',
    id: '1',
    reference: 'ABC123',
    restaurant: 'KFC 1',
  },
  {
    coutCommande: '2500 Fcfa',
    coutLivraison: '2000 Fcfa',
    dateHeure: '2022-01-01 2h:30',
    id: '2',
    reference: 'XYZ456',
    restaurant: 'KFC 2',
  },
];

export default function BancSocle() {
  const [recherche, setRecherche] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [annee, setAnnee] = React.useState(2026);

  return (
    <main className="flex flex-col gap-8 p-6">
      <section className="flex flex-col gap-4 rounded-xl border border-separator p-4">
        <h2 className="text-sm font-semibold">SearchField / SearchBar / CalendarInput / YearFilter</h2>
        <SearchField onChange={setRecherche} searchKey={recherche} />
        <SearchBar items={['KFC 1', 'KFC 2', 'Burger House']} />
        <CalendarInput className="w-[220px]" onChange={setDate} placeholder="Date de livraison" value={date} />
        <YearFilter isLoading={false} onYearChange={setAnnee} selectedYear={annee} />
        <YearFilter isLoading onYearChange={setAnnee} selectedYear={annee} />
        <p className="text-xs text-muted">
          recherche = {recherche || 'vide'} / date = {date ? date.toISOString() : 'aucune'} / annee = {annee}
        </p>
      </section>

      <DetailContent data={LIGNES} />
    </main>
  );
}
