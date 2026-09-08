'use client';

import { Card } from '@heroui-v3/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMemo } from 'react';
import { Pie, PieChart } from 'recharts';

import EtatErreur from '@/components/commons/EtatErreur';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useDepenseDashboardFilters } from '@/features/depenses/hooks/use-depense-dashboard-filters';
import { useTopCategorieDepenseQuery } from '@/features/depenses/queries/category/top4-category-depense.query';
import { ITopCategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { cn } from '@/lib/utils';

/*
 * Dix teintes distinctes, parce qu'ici la couleur est la SEULE clef qui relie une part a
 * sa categorie. Le rouge vif de tete a saute : sur un camembert de depenses, il se lisait
 * comme une alerte alors qu'il ne designait que la premiere categorie du classement.
 */
const TEINTES = [
  '#2563eb',
  '#0d9488',
  '#7c3aed',
  '#c2410c',
  '#0891b2',
  '#a16207',
  '#be185d',
  '#4d7c0f',
  '#6366f1',
  '#78716c',
];

const teinte = (index: number) => TEINTES[index % TEINTES.length];

function construireDonnees(categories: ITopCategorieDepense[]) {
  return categories.map((cat, index) => ({
    category: cat.nom,
    fill: teinte(index),
    montant: cat.totalmontant,
  }));
}

function construireConfig(categories: ITopCategorieDepense[]): ChartConfig {
  const config: ChartConfig = { montant: { label: 'Montant' } };

  categories.forEach((cat, index) => {
    config[cat.nom] = { color: teinte(index), label: cat.nom };
  });

  return config;
}

interface RepartitionDepensePieChartProps {
  className?: string;
  debut?: Date;
  fin?: Date;
}

/**
 * Les categories qui pesent le plus sur la periode.
 *
 * <p>L'echec de lecture s'affichait en « Erreur lors du chargement des donnees », sans
 * relance : il fallait recharger la page entiere. Il propose de reessayer, comme les deux
 * autres graphiques de la page.</p>
 */
export default function RepartitionDepensePieChart({
  className,
  debut: debutProp,
  fin: finProp,
}: RepartitionDepensePieChartProps) {
  const { filters } = useDepenseDashboardFilters();
  const debut = debutProp ?? filters.debut;
  const fin = finProp ?? filters.fin;
  const {
    data: categoriesDepense,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useTopCategorieDepenseQuery({
    categorieIds: filters.categoriesDepense,
    debut,
    fin,
  });

  const chartData = useMemo(() => construireDonnees(categoriesDepense || []), [categoriesDepense]);
  const chartConfig = useMemo(() => construireConfig(categoriesDepense || []), [categoriesDepense]);

  return (
    <Card className={cn('flex flex-col', className)}>
      <Card.Header>
        <Card.Title>Répartition des dépenses</Card.Title>
        {debut && fin && (
          <Card.Description>
            {format(debut, 'd LLL y', { locale: fr })} - {format(fin, 'd LLL y', { locale: fr })}
          </Card.Description>
        )}
      </Card.Header>
      <Card.Content className="flex-1">
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted">Chargement...</div>
          </div>
        ) : isError ? (
          <div className="flex h-[300px] items-center justify-center">
            <EtatErreur
              enCours={isFetching}
              onReessayer={() => refetch()}
              quoi="la répartition par catégorie"
            />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer className="mx-auto aspect-square px-0" config={chartConfig}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="montant" labelLine={false} nameKey="category" />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted">Aucune dépense sur la période</div>
          </div>
        )}
      </Card.Content>
      <Card.Footer className="flex-col items-start gap-1 text-sm">
        <span className="font-medium text-foreground">Top 10 catégories</span>
        <span className="text-muted">
          Comment les dépenses sont distribuées entre les catégories.
        </span>
      </Card.Footer>
    </Card>
  );
}
