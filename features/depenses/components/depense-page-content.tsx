'use client';

import StatisticDepenseCards from '@/features/depenses/components/statistiques/statistic-depense-cards';
import RepartitionDepense from '@/features/depenses/components/repartition/index';
import DepenseTabs from '@/components/depenses/depense-table/depense-tabs';
import DepenseHeader from '@/components/components-finance/depenses/header';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import DateFilterInput from '@/components/finance/date-filter-input';
import { CategoriesSelectFilter } from '@/components/depenses/depense-table/categories-select-filter';
import { Button } from '@heroui-v3/react';
import { useDepenseExport } from '@/features/depenses/hooks/use-depense-export';

export default function DepensePageContent() {
  const { filters, handleDateChange, handleCategoriesChange } = useDepenseDashboardFilters();
  const { exportDepensesToExcel, isLoadingDepenseExport } = useDepenseExport();

  const handleExport = () => {
    exportDepensesToExcel({
      debut: filters.debut,
      fin: filters.fin,
      categoriesDepense: filters.categoriesDepense,
    });
  };

  return (
    <div className="flex flex-col gap-6 px-4 ">
      <DepenseHeader />
      <div className="flex items-center justify-end gap-4">
        {/* Le bouton d'export etait peint en SUCCES. Exporter n'est pas une reussite,
            c'est une action ordinaire : le vert y etait reserve pour rien. Et le libelle
            changeait pendant l'attente, alors que le bouton v3 montre deja son propre
            indicateur — on lisait « Exportation... » a cote d'un cercle qui tourne. */}
        <Button isPending={isLoadingDepenseExport} onPress={handleExport} variant="outline">
          Exporter (Excel)
        </Button>
        <CategoriesSelectFilter selectedCategories={filters.categoriesDepense || []} onCategoriesChange={handleCategoriesChange} />
        <DateFilterInput filters={filters} handleDateChange={handleDateChange} />
      </div>
      <StatisticDepenseCards filters={filters} />
      <RepartitionDepense />
      <DepenseTabs />
    </div>
  );
}

