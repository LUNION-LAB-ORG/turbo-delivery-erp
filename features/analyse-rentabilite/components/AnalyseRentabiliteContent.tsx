'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@heroui-v3/react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import RevenueExpenseChart from './RevenueExpenseChart';
import DateFilterInput from '@/components/finance/date-filter-input';
import { useGlobalStats } from '@/features/finance-dashboard/queries/global-stats.query';
import { useDepenseSummaryQuery } from '@/features/depenses/queries/depense-summary.query';
import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { endOfMonth, startOfMonth } from 'date-fns';
import EtatErreur from '@/components/commons/EtatErreur';

export default function AnalyseRentabiliteContent() {
  const [filters, setFilters] = useState(() => {
    const now = new Date();
    return {
      debut: startOfMonth(now),
      fin: endOfMonth(now),
    };
  });

  const handleDateChange = (value: any) => {
    setFilters({
      debut: value?.from,
      fin: value?.to,
    });
  };

  // Récupérer les données des API
  const {
    data: globalStats,
    isLoading: isLoadingGlobal,
    isFetching: isFetchingGlobal,
    isError: isErrorGlobal,
    refetch: refetchGlobal,
  } = useGlobalStats({
    debut: filters.debut,
    fin: filters.fin,
  });

  const {
    data: depenseSummary,
    isLoading: isLoadingDepenses,
    isFetching: isFetchingDepenses,
    isError: isErrorDepenses,
    refetch: refetchDepenses,
  } = useDepenseSummaryQuery({
    debut: filters.debut,
    fin: filters.fin,
  });

  const { data: chargesFixesData } = useChargesFixesQuery({
    size: 100,
  });

  // Calculer les statistiques
  const stats = useMemo(() => {
    const chiffreAffaires = globalStats?.chiffreAffaire ?? 0;
    const totalRecurrentes = depenseSummary?.totalRecurrentes ?? 0;
    const totalNonRecurrentes = depenseSummary?.totalNonRecurrentes ?? 0;
    const totalDepenses = globalStats?.depenses ?? 0;

    const totalFixes = chargesFixesData?.content?.reduce((sum, c) => sum + (c.montant ?? 0), 0) ?? 0;
    const totalVariables = depenseSummary?.totalNonRecurrentes ?? 0;

    const marge = chiffreAffaires - totalDepenses;
    const tauxMarge = chiffreAffaires > 0 ? (marge / chiffreAffaires) * 100 : 0;
    const isDeficit = marge < 0;

    return {
      chiffreAffaires,
      totalDepenses,
      marge,
      tauxMarge,
      isDeficit,
      totalRecurrentes,
      totalNonRecurrentes,
      totalFixes,
      totalVariables,
      formattedChiffreAffaires: formatCFA(chiffreAffaires),
      formattedTotalDepenses: formatCFA(totalDepenses),
      formattedMarge: formatCFA(marge),
      formattedRecurrentes: formatCFA(totalRecurrentes),
      formattedNonRecurrentes: formatCFA(totalNonRecurrentes),
      formattedTotalFixes: formatCFA(totalFixes),
      formattedTotalVariables: formatCFA(totalVariables),
    };
  }, [globalStats, depenseSummary, chargesFixesData]);

  const isErreurRentabilite = isErrorGlobal || isErrorDepenses;
  const reessayerRentabilite = () => {
    if (isErrorGlobal) refetchGlobal();
    if (isErrorDepenses) refetchDepenses();
  };

  return (
    <div className="p-6 bg-surface-secondary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        {/* Un bouton « retour » etait pose ici SANS gestionnaire et sans libelle : une
            fleche visible, cliquable, qui ne faisait rien et n'etait annoncee nulle part.
            Le titre etait peint en ROUGE DE MARQUE. */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analyse de rentabilité</h1>
          <p className="text-sm text-muted">Vos performances financières sur la période</p>
        </div>

        <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      </div>

      {/* Stats */}
      {/* Sur echec, CA et depenses valent 0 : la marge vaut 0, le taux 0,0 % et le
          pied de page annonce « Rentable ». Un echec ne doit pas rendre un verdict. */}
      {/*
       * Les quatre cartes etaient peintes a la main : les depenses sur `bg-orange-50`, la
       * marge sur `bg-green-50`, sans variante sombre — et la marge portait EN PLUS son
       * verdict en `text-red-600` / `text-green-600`. Les depenses d'un mois ne sont pas
       * un avertissement : c'est la MARGE qui dit si l'exercice va bien, et elle le dit
       * une fois.
       *
       * Et le chiffre etait remplace par le mot « Chargement... » pendant l'attente : une
       * phrase la ou l'oeil cherche un montant, qui deplacait la mise en page a chaque
       * arrivee. `CarteStat` porte son squelette, et son etat d'echec — sans lui, un CA et
       * des depenses a zero donnaient une marge de zero, un taux de 0,0 % et le verdict
       * « Rentable » en pied de page.
       */}
      <GrilleStats className="mb-6" colonnes={4}>
        <CarteStat
          isError={isErreurRentabilite}
          isLoading={isLoadingGlobal}
          libelle="Chiffre d'affaires"
          valeur={stats.formattedChiffreAffaires}
        />
        <CarteStat
          isError={isErreurRentabilite}
          isLoading={isLoadingDepenses}
          libelle="Total des dépenses"
          valeur={stats.formattedTotalDepenses}
        />
        <CarteStat
          isError={isErreurRentabilite}
          isLoading={isLoadingGlobal || isLoadingDepenses}
          libelle="Marge actuelle"
          ton={stats.isDeficit ? 'danger' : 'succes'}
          valeur={stats.formattedMarge}
        />
        <CarteStat
          isError={isErreurRentabilite}
          isLoading={isLoadingGlobal || isLoadingDepenses}
          libelle="Taux de marge"
          valeur={`${stats.tauxMarge.toFixed(1)} %`}
        />
      </GrilleStats>

      {isErreurRentabilite && (
        <div className="mb-6">
          <EtatErreur
            enCours={isFetchingGlobal || isFetchingDepenses}
            onReessayer={reessayerRentabilite}
            quoi="les indicateurs de rentabilité"
          />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Chart */}
        <Card>
          <Card.Content className="p-0">
            <RevenueExpenseChart debut={filters.debut} fin={filters.fin} />
          </Card.Content>
        </Card>

        {/* Expenses */}
        {/* <Card>
          <CardBody className="p-4">
            <h3 className="text-sm font-semibold mb-4">
              Détail des Dépenses
            </h3>

            <ul className="space-y-2 text-sm">
              {chargesFixesData?.content?.map((charge) => (
                <li key={charge.id} className="flex justify-between">
                  <span>{charge.designation}</span>
                  <span>{formatCFA(charge.montant)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t mt-4 pt-4 text-sm">
              <div className="flex justify-between font-semibold text-red-500">
                <span>TOTAL</span>
                <span>{isLoadingGlobal ? 'Chargement...' : stats.formattedTotalDepenses}</span>
              </div>

              <div className="mt-3 flex justify-between text-blue-500">
                <span>Charges Fixes</span>
                <span>{isLoadingChargesFixes ? 'Chargement...' : stats.formattedTotalFixes}</span>
              </div>

              <div className="flex justify-between text-purple-500">
                <span>Dépenses Variables</span>
                <span>{isLoadingDepenses ? 'Chargement...' : stats.formattedTotalVariables}</span>
              </div>
            </div>
          </CardBody>
        </Card> */}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 mt-6 text-sm text-muted">
        <span>
          Période analysée : du{' '}
          {filters.debut ? new Date(filters.debut).toLocaleDateString('fr-FR') : '…'} au{' '}
          {filters.fin ? new Date(filters.fin).toLocaleDateString('fr-FR') : '…'}
        </span>
        {!isErreurRentabilite && (
          <span
            className={`font-medium ${
              stats.isDeficit ? 'text-danger-soft-foreground' : 'text-success-soft-foreground'
            }`}
          >
            {stats.isDeficit ? 'Déficit' : 'Rentable'}
          </span>
        )}
      </div>
    </div>
  );
}


