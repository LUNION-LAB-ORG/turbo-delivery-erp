'use client';

import { Spinner } from '@heroui-v3/react';
import { useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { EntreeCaisseMiniTable } from '@/components/finance/entrees-caisse/entree-caisse-mini-table';

import { useBilanAnnuel } from '../hooks/use-bilan-annuel';
import { DashboardHeader } from './dashboard-header';
import { MonthCard } from './month-card';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

// L'annee en cours d'abord : c'est celle qu'on ouvre, et la liste s'allonge par le bas.
const years = Array.from(
  { length: currentYear - 2024 + 1 },
  (_, i) => String(currentYear - i),
);

export default function DashboardPerformance() {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { monthsData, isError, isFetching, isLoading, refetch } = useBilanAnnuel(selectedYear);

  const visibleMonths = monthsData.filter((month) => {
    if (selectedYear !== String(currentYear)) return true;
    return month.progress <= currentMonth;
  });

  return (
    <div className="bg-surface-secondary p-4 sm:p-6">
      <DashboardHeader
        selectedYear={selectedYear}
        years={years}
        onYearChange={setSelectedYear}
      />

      {/* Pendant la lecture, chaque mois affichait « Aucun chiffre pour ce mois » : douze
          affirmations fausses, qui se lisent comme une annee sans activite. On ne dit rien
          tant qu'on ne sait pas. L'echec, lui, remplace les mois pour la meme raison. */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <EtatErreur quoi="le bilan annuel" onReessayer={() => refetch()} enCours={isFetching} />
      ) : (
        <div className="flex flex-col gap-6">
          {visibleMonths.map((month) => (
            <MonthCard key={month.month} month={month} />
          ))}
        </div>
      )}

      {/* Le mini-tableau porte deja son titre et sa propre carte : une seconde carte
          autour n'ajoutait qu'une bordure et une marge. */}
      <div className="mt-8">
        <EntreeCaisseMiniTable />
      </div>
    </div>
  );
}
