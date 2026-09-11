'use client';

import { useSession } from 'next-auth/react';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { usePerformanceStats } from '@/features/rapports-performance/hooks/use-performance-stats';
import { usePerformanceFilters } from '@/features/rapports-performance/hooks/use-performance-filters';
import { useGroupesListeQuery } from '@/features/groupes-partenaires/queries/groupes-partenaires.query';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants';

import { decrireSelection } from '../utils/selection.utils';
import { exportPerformancePdf } from '../utils/performance-export.utils';
import { ChartsSection } from './charts-section';
import { DetailParStoreSection } from './detail-par-store/detail-par-store-section';
import { FinancialDetailsSection } from './financial-details-section';
import { MiddleStatsSection } from './middle-stats-section';
import { PerformanceHeader } from './performance-header';
import { PerformanceSummarySection } from './performance-summary-section';
import { SelecteurSelection } from './selecteur-selection';
import { TopStatsSection } from './top-stats-section';

export default function PerformanceReport() {
  const { data, isError, isLoading, isFetching, refetch } = usePerformanceStats();
  const {
    filters,
    handleDateChange,
    handleGroupeChange,
    handleModeChange,
    handleRestaurantChange,
    handleRestaurantIdsChange,
    mode,
  } = usePerformanceFilters();

  const { data: restaurants = [], isLoading: restaurantsEnChargement } = useDefinedRestaurantsQuery();
  const restoOpts = React.useMemo(() => toRestaurantOptions(restaurants), [restaurants]);

  /*
   * La liste des groupes n'est lue QUE si l'operateur est en mode groupe : passer une chaine
   * vide desactive la requete (`enabled: !!userId`). L'endpoint est reserve a la Direction,
   * aux administrateurs et aux Ops Managers - le lire a chaque ouverture de la page ferait
   * un 403 systematique dans le journal pour tous les comptes Finance, qui sont la majorite
   * des lecteurs de cet ecran.
   */
  const { data: sessionAuth } = useSession();
  const userId = sessionAuth?.user?.id ?? '';
  const {
    data: groupes = [],
    isError: groupesEnErreur,
    isLoading: groupesEnChargement,
  } = useGroupesListeQuery(mode === 'GROUPE' ? userId : '');

  const optionsGroupes = React.useMemo(
    () => groupes.map((g) => ({ id: g.id, nom: g.nom, nbEtablissements: g.nbEtablissements })),
    [groupes],
  );

  const geographicData = data?.geographicData ?? [];
  const weeklyActivityData = data?.weeklyActivity ?? [];
  const mainKPIs = data?.mainKPIs;
  const secondaryKPIs = data?.secondaryKPIs;
  const financialDetails = data?.financialDetails;

  /*
   * ⚠ `parStore` NUL et `parStore` VIDE ne veulent pas dire la meme chose. Nul = mode
   * unitaire ou global, il n'y a rien a detailler. Vide = une selection multiple qui ne
   * designe aucun etablissement, ce qui se dit et ne se cache pas. Le `??` d'usage aurait
   * confondu les deux et retire le bloc dans les deux cas.
   */
  const parStore = data?.parStore ?? null;

  const selection = React.useMemo(
    () =>
      decrireSelection(
        data?.selection,
        {
          mode,
          restaurantId: filters.restaurantId,
          restaurantIds: filters.restaurantIds,
          groupeId: filters.groupeId,
        },
        {
          nomRestaurant: (id) => restoOpts.find((o) => o.value === id)?.label,
          nomGroupe: (id) => optionsGroupes.find((g) => g.id === id)?.nom,
        },
      ),
    [data?.selection, filters.groupeId, filters.restaurantId, filters.restaurantIds, mode, optionsGroupes, restoOpts],
  );

  const handleExportPdf = async () => {
    await exportPerformancePdf({
      mainKPIs,
      secondaryKPIs,
      financialDetails,
      libelleSelection: selection.libelle,
      consolide: selection.consolide,
      parStore,
      debut: filters.debut,
      fin: filters.fin,
    });
  };

  return (
    <div className="bg-surface-secondary p-6">
      <PerformanceHeader
        avertissement={selection.avertissement}
        debut={filters.debut}
        fin={filters.fin}
        libelleSelection={selection.libelle}
        onDateChange={handleDateChange}
        onExportPdf={handleExportPdf}
        selecteur={
          <SelecteurSelection
            groupeId={filters.groupeId || undefined}
            groupes={optionsGroupes}
            groupesEnChargement={groupesEnChargement}
            groupesEnErreur={groupesEnErreur}
            mode={mode}
            onGroupeChange={(v) => handleGroupeChange(v ?? null)}
            onModeChange={handleModeChange}
            onRestaurantChange={(v) => handleRestaurantChange(v ?? null)}
            onRestaurantIdsChange={handleRestaurantIdsChange}
            restaurantId={filters.restaurantId || undefined}
            restaurantIds={filters.restaurantIds}
            restaurants={restoOpts}
            restaurantsEnChargement={restaurantsEnChargement}
          />
        }
      />

      {/* L'echec remplace le rapport entier. Sans cela, chaque KPI retombait sur 0 :
          l'ecran affirmait « zero livraison, zero chiffre d'affaires » sur une periode
          qu'il n'avait pas pu lire. L'entete reste, pour changer de periode. */}
      {isError ? (
        <EtatErreur
          quoi="le rapport de performance"
          onReessayer={() => refetch()}
          enCours={isFetching}
        />
      ) : (
        <div className="space-y-6">
          <TopStatsSection
            debut={filters.debut}
            enChargement={isLoading}
            financialDetails={financialDetails}
            fin={filters.fin}
            mainKPIs={mainKPIs}
          />
          <ChartsSection geographicData={geographicData} weeklyActivityData={weeklyActivityData} />
          <MiddleStatsSection enChargement={isLoading} secondaryKPIs={secondaryKPIs} />
          <FinancialDetailsSection
            consolide={selection.consolide}
            debut={filters.debut}
            detailDisponible={(parStore?.length ?? 0) > 0}
            financialDetails={financialDetails}
            fin={filters.fin}
            nombreEtablissements={selection.nombre}
          />

          {/*
           * Le detail par store n'existe QUE quand le serveur l'a servi. En unitaire il est
           * nul et le bloc n'a pas lieu d'etre : c'est la note du lot, mot pour mot.
           */}
          {parStore !== null && (
            <DetailParStoreSection
              enChargement={isLoading}
              lignes={parStore}
              raisonVide={selection.avertissement}
            />
          )}

          <PerformanceSummarySection
            mainKPIs={mainKPIs}
            secondaryKPIs={secondaryKPIs}
            sujetSelection={selection.sujet}
          />
        </div>
      )}
    </div>
  );
}
