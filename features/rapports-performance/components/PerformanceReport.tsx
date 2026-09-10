'use client';

import { usePerformanceStats } from '@/features/rapports-performance/hooks/use-performance-stats';
import { usePerformanceFilters } from '@/features/rapports-performance/hooks/use-performance-filters';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants';
import { PerformanceHeader } from './performance-header';
import { TopStatsSection } from './top-stats-section';
import { ChartsSection } from './charts-section';
import { MiddleStatsSection } from './middle-stats-section';
import { FinancialDetailsSection } from './financial-details-section';
import { PerformanceSummarySection } from './performance-summary-section';
import { exportPerformancePdf } from '../utils/performance-export.utils';
import EtatErreur from '@/components/commons/EtatErreur';

export default function PerformanceReport() {
  const { data, isError, isLoading, isFetching, refetch } = usePerformanceStats();
  const { filters, handleDateChange, handleRestaurantChange } = usePerformanceFilters();
  const { data: restaurants = [] } = useDefinedRestaurantsQuery();
  const restoOpts = toRestaurantOptions(restaurants);

  const geographicData = data?.geographicData ?? [];
  const weeklyActivityData = data?.weeklyActivity ?? [];
  const mainKPIs = data?.mainKPIs;
  const secondaryKPIs = data?.secondaryKPIs;
  const financialDetails = data?.financialDetails;
  const selectedRestaurant = restoOpts.find((o) => o.value === filters.restaurantId)?.label || 'Tous';

  const onRestaurantFilterChange = (value?: string) => {
    handleRestaurantChange(value ?? null);
  };

  const handleExportPdf = async () => {
    await exportPerformancePdf({
      mainKPIs,
      secondaryKPIs,
      financialDetails,
      selectedRestaurant,
      debut: filters.debut,
      fin: filters.fin,
    });
  };

  return (
    <div className="bg-surface-secondary p-6">
      <PerformanceHeader
        selectedRestaurant={selectedRestaurant}
        restaurantId={filters.restaurantId || undefined}
        debut={filters.debut}
        fin={filters.fin}
        onDateChange={handleDateChange}
        onRestaurantChange={onRestaurantFilterChange}
        onExportPdf={handleExportPdf}
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
          <TopStatsSection debut={filters.debut} enChargement={isLoading} fin={filters.fin} mainKPIs={mainKPIs} />
          <ChartsSection geographicData={geographicData} weeklyActivityData={weeklyActivityData} />
          <MiddleStatsSection enChargement={isLoading} secondaryKPIs={secondaryKPIs} />
          <FinancialDetailsSection financialDetails={financialDetails} />
          <PerformanceSummarySection
            mainKPIs={mainKPIs}
            secondaryKPIs={secondaryKPIs}
            selectedRestaurant={selectedRestaurant}
          />
        </div>
      )}
    </div>
  );
}

