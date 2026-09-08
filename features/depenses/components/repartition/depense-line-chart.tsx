'use client';

import { Card } from '@heroui-v3/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import EtatErreur from '@/components/commons/EtatErreur';
import YearSelect from '@/components/commons/year-select';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { recupererDonnees } from '@/features/depenses/depense-stats.utils';
import { useDashboardStatsQuery } from '@/features/finance-dashboard/queries/dashboard-stats.query';
import { cn } from '@/lib/utils';

/*
 * La courbe etait ROUGE. Le rouge de cet ERP dit « ceci appelle un geste » ; l'historique
 * des depenses d'une annee ecoulee n'en appelle aucun, il se lit. Une teinte franche mais
 * sans verdict, declaree par theme pour rester lisible en sombre.
 */
const chartConfig = {
  montant: {
    label: 'Montant',
    theme: { dark: '#60a5fa', light: '#2563eb' },
  },
} satisfies ChartConfig;

/**
 * L'evolution des depenses mois par mois.
 */
export default function DepenseLineChart({ className }: { className?: string }) {
  const [year, setYear] = React.useState<string>(new Date().getFullYear().toString());
  const {
    data: dashboardStats,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useDashboardStatsQuery({ annee: parseInt(year) });

  const depenseData = useMemo(() => {
    if (!dashboardStats) return [];
    return recupererDonnees(dashboardStats, 'depenses', parseInt(year));
  }, [dashboardStats, year]);

  const chartData = useMemo(() => {
    const moisCourant = new Date().getMonth() + 1; // 1-12
    const anneeCourante = new Date().getFullYear();
    const anneeChoisie = parseInt(year);

    // Sur l'annee en cours, les mois a venir tireraient la courbe a zero.
    const filtre = depenseData.filter((item) => {
      const mois = new Date(item.date).getMonth() + 1;
      return anneeChoisie === anneeCourante ? mois <= moisCourant : true;
    });

    return filtre.map((item) => ({
      count: item.data.count,
      month: format(new Date(item.date), 'MMM', { locale: fr }),
      montant: item.data.montant,
    }));
  }, [depenseData, year]);

  return (
    <Card className={cn('', className)}>
      <Card.Header className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <Card.Title>Évolution des dépenses</Card.Title>
          <Card.Description>Année {year}</Card.Description>
        </div>
        <YearSelect onChange={(nouvelleAnnee) => setYear(nouvelleAnnee)} value={year} />
      </Card.Header>
      <Card.Content>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted">Chargement...</div>
          </div>
        ) : isError ? (
          /* Sans donnee, la courbe tombait sur « Aucune depense sur la periode » :
             une annee illisible se lisait comme une annee sans depense. */
          <div className="flex h-[300px] items-center justify-center">
            <EtatErreur
              enCours={isFetching}
              onReessayer={() => refetch()}
              quoi="l'évolution des dépenses"
            />
          </div>
        ) : chartData.length > 0 ? (
          <ChartContainer className="h-[220px] w-full" config={chartConfig}>
            <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
              <Line
                activeDot={{ r: 6 }}
                dataKey="montant"
                dot={{ fill: 'var(--color-montant)' }}
                stroke="var(--color-montant)"
                strokeWidth={2}
                type="linear"
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center">
            <div className="text-muted">Aucune dépense sur la période</div>
          </div>
        )}
      </Card.Content>
      <Card.Footer>
        <p className="w-full text-center text-sm leading-none text-muted">
          L&#39;évolution des dépenses durant la période choisie.
        </p>
      </Card.Footer>
    </Card>
  );
}
