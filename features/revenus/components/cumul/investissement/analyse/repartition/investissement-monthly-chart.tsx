'use client';

import { Card } from '@heroui-v3/react';
import { format, getMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { ChampListe } from '@/components/commons/champs-formulaire';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  useInvestissementMonthlyFilters,
  useInvestissementStatsMonthly,
} from '@/features/investissement/hooks';

/*
 * Les deux series etaient peintes en hexadecimaux ecrits en dur (`#3B82F6` et `#10B981`),
 * donc identiques dans les deux themes et etrangeres a la palette.
 *
 * Le `chartConfig` annoncait bien `var(--chart-1)`, mais cette variable ne contient PAS une
 * couleur : `styles/tailwind.css` y range un triplet HSL nu (`12 76% 61%`), qu'il faut
 * envelopper dans `hsl()`. La declaration etait donc invalide, ignoree par le navigateur, et
 * les barres ne devaient leur couleur qu'aux hexadecimaux : c'est ce qui masquait la panne.
 */
const chartConfig = {
  montantInvestissement: {
    color: 'hsl(var(--chart-1))',
    label: 'Investissement',
  },
  montantRembourse: {
    color: 'hsl(var(--chart-2))',
    label: 'Remboursement',
  },
} satisfies ChartConfig;

// Générer la liste des années de 2025 à aujourd'hui
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2025; year <= currentYear; year++) {
    years.push({ label: year.toString(), value: year.toString() });
  }
  return years;
};

// Générer tous les mois de l'année jusqu'au mois actuel
const generateCompleteMonthlyData = (data: any[], selectedYear: string) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = getMonth(new Date()); // 0-11
  const isCurrentYear = parseInt(selectedYear) === currentYear;

  // Déterminer le dernier mois à afficher
  const lastMonth = isCurrentYear ? currentMonth : 11;

  // Créer un tableau avec tous les mois
  const allMonths = [];
  for (let month = 0; month <= lastMonth; month++) {
    const date = new Date(parseInt(selectedYear), month, 1);

    // Chercher les données correspondantes
    const existingData = data?.find((item) => item.date.startsWith(format(date, 'yyyy-MM')));

    allMonths.push({
      month: format(date, 'MMMM', { locale: fr }),
      montantInvestissement: existingData?.montantInvestissement || 0,
      montantRembourse: existingData?.montantRembourse || 0,
    });
  }

  return allMonths;
};

export function InvestissementMonthlyChart() {
  const { data, isError, isFetching, isLoading, refetch } = useInvestissementStatsMonthly();
  const { updateYear, year } = useInvestissementMonthlyFilters();

  const years = generateYears();

  // Générer les données complètes avec tous les mois jusqu'au mois actuel
  const chartData = generateCompleteMonthlyData(data || [], year);

  if (isLoading) {
    return (
      <Card>
        <Card.Header>
          <div className="mb-2 h-6 w-64 animate-pulse rounded bg-surface-tertiary" />
          <div className="h-4 w-48 animate-pulse rounded bg-surface-tertiary" />
        </Card.Header>
        <Card.Content>
          <div className="h-[300px] animate-pulse rounded bg-surface-tertiary" />
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Répartition mensuelle des investissements et remboursements</Card.Title>
        <div className="mt-4 max-w-xs">
          <ChampListe
            label="Année"
            onChange={(v) => v && updateYear(v)}
            options={years}
            placeholder="Choisir une année"
            valeur={year}
          />
        </div>
      </Card.Header>
      <Card.Content>
        {/* `generateCompleteMonthlyData` fabrique douze mois a zero quand il n'a pas
            de donnee : le graphe restait dessine, plat, et personne ne voyait l'echec. */}
        {isError ? (
          <EtatErreur
            enCours={isFetching}
            onReessayer={() => refetch()}
            quoi="la répartition mensuelle"
          />
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="month"
                tickFormatter={(value) => value.slice(0, 3)}
                tickLine={false}
                tickMargin={10}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="montantInvestissement"
                fill="var(--color-montantInvestissement)"
                radius={[0, 0, 4, 4]}
                stackId="a"
              />
              <Bar
                dataKey="montantRembourse"
                fill="var(--color-montantRembourse)"
                radius={[4, 4, 0, 0]}
                stackId="a"
              />
            </BarChart>
          </ChartContainer>
        )}
      </Card.Content>
      <Card.Footer className="flex-col items-start gap-2 text-sm">
        <p className="font-medium leading-none text-muted">Données pour l&#39;année {year}</p>
      </Card.Footer>
    </Card>
  );
}

// Alias pour la compatibilité avec les imports existants
export default InvestissementMonthlyChart;
