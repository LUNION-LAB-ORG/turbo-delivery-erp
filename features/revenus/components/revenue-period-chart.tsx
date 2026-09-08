'use client';

import { Card } from '@heroui-v3/react';
import { startOfMonth } from 'date-fns';
import { BarChart3, Calendar, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import EtatErreur from '@/components/commons/EtatErreur';
import DateFilterInput from '@/components/finance/date-filter-input';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { formatMontant } from '@/utils/format.utils';

import { useRevenuePeriod } from '../hooks/use-revenue-period';

type Period = 'WEEK' | 'MONTH';

const periodLabels = {
  MONTH: 'Mois',
  WEEK: 'Semaine',
};

/*
 * La courbe etait tracee en `#dc2626`, le ROUGE DE MARQUE, avec un point actif jaune vif,
 * et les barres de comparaison dans la meme teinte. Le rouge de ce projet est reserve a ce
 * qui appelle un geste ; cet ecran ne fait que rendre compte, on n'y clique rien. Les series
 * passent aux couleurs de graphe du theme, declarees pour le clair et pour le sombre.
 */
const chartConfig = {
  revenue: {
    color: 'hsl(var(--chart-1))',
    label: 'Revenu',
  },
  value: {
    color: 'hsl(var(--chart-1))',
    label: 'Revenu',
  },
} satisfies ChartConfig;

export default function RevenuePeriodChart() {
  /*
   * `setSelectedPeriod` n'etait appele nulle part : aucun element de l'ecran ne permettait
   * de passer a la semaine. C'etait un etat mort qui se lisait comme un reglage.
   */
  const selectedPeriod: Period = 'MONTH';

  // État pour le filtre par plage de dates
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  // Toujours utiliser le mois actuel si pas de plage personnalisée
  const currentMonth = new Date();
  const apiDate = dateRange?.from
    ? dateRange.from.toISOString().split('T')[0]
    : currentMonth.toISOString().split('T')[0];

  const { error, isError, isLoading, monthlyChartData, refetch, revenueData } = useRevenuePeriod({
    date: apiDate,
    endDate: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined,
    initialData: null,
    period: selectedPeriod,
    startDate: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
  });

  // Affichait le CODE devise brut de l'API (« 1 500 XOF »), là où le reste de l'ERP
  // écrit « 1 500 FCFA ». Un même montant changeait donc de devise d'un écran à l'autre.
  const formatCurrency = (value: number) => formatMontant(value);

  // Utiliser directement les statistiques de l'API
  const stats = revenueData?.statistics;

  // Récupérer les données YEAR pour la comparaison mensuelle
  // `isError` etait jete : quand la requete YEAR tombait, `yearData` restait null, le
  // useMemo ci-dessous sortait a null, et le bloc « Comparaison mensuelle » DISPARAISSAIT
  // de la page, sans squelette et sans message, le reste de l'ecran restant normal. Rien
  // ne distinguait une panne d'une periode sans historique.
  const {
    isError: isYearError,
    refetch: refetchYear,
    revenueData: yearData,
  } = useRevenuePeriod({
    date: undefined,
    endDate: undefined,
    initialData: null,
    period: 'YEAR',
    startDate: undefined,
  });

  // Calculer la comparaison entre mois en cours et mois passé
  const monthlyComparison = useMemo(() => {
    if (!yearData?.data || yearData.data.length === 0) {
      return null;
    }

    const currentDate = new Date();
    const moisCourant = currentDate.getMonth() + 1; // 1-12
    const moisPrecedent = moisCourant === 1 ? 12 : moisCourant - 1;
    const anneeCourante = currentDate.getFullYear();
    const anneePrecedente = moisCourant === 1 ? anneeCourante - 1 : anneeCourante;

    // Trouver les données du mois en cours et du mois passé
    const currentMonthData = yearData.data.find((item) => item.month === moisCourant);
    const previousMonthData = yearData.data.find((item) => item.month === moisPrecedent);

    if (!currentMonthData || !previousMonthData) {
      return null;
    }

    const currentRevenue = currentMonthData.value || 0;
    const previousRevenue = previousMonthData.value || 0;
    const change = currentRevenue - previousRevenue;
    const changePercentage = previousRevenue > 0 ? (change / previousRevenue) * 100 : 0;

    return {
      change,
      changePercentage: Math.abs(changePercentage),
      currentMonth: {
        name: new Date(anneeCourante, moisCourant - 1).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
        revenue: currentRevenue,
      },
      previousMonth: {
        name: new Date(anneePrecedente, moisPrecedent - 1).toLocaleDateString('fr-FR', {
          month: 'long',
          year: 'numeric',
        }),
        revenue: previousRevenue,
      },
    };
  }, [yearData]);

  const getPeriodDisplay = () => {
    if (!revenueData) return '';

    // Si une plage personnalisée est sélectionnée, l'afficher en priorité
    if (dateRange?.from && dateRange?.to) {
      const start = new Date(dateRange.from);
      const end = new Date(dateRange.to);
      return `Période du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
    }

    // Sinon, utiliser les données de l'API
    switch (revenueData.period) {
      case 'week':
        if (revenueData.startDate && revenueData.endDate) {
          const start = new Date(revenueData.startDate);
          const end = new Date(revenueData.endDate);
          return `Semaine du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')}`;
        }
        return 'Cette semaine';
      case 'month':
        return `Mois de ${currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      default:
        return '';
    }
  };

  // Utiliser les données mensuelles pour le graphique (toujours le mois complet)
  const chartData = monthlyChartData?.data || revenueData?.data || [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-64 animate-pulse rounded bg-surface-tertiary" />
        <div className="h-64 animate-pulse rounded bg-surface-tertiary" />
      </div>
    );
  }

  if (isError) {
    // Le message technique etait affiche EN GRAND, en rouge, a la place de l'ecran : un
    // « Request failed with status code 500 » ne dit rien a un comptable et ne lui offrait
    // aucun moyen de relancer. Il reste lisible, en retrait, pour le support.
    return (
      <EtatErreur
        detail={error instanceof Error ? error.message : undefined}
        onReessayer={() => refetch()}
        quoi="les revenus de la période"
      />
    );
  }

  if (!revenueData) {
    return (
      <div className="flex flex-col gap-6">
        <p className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning-soft-foreground">
          Aucun revenu sur cette période
        </p>

        {/*
         * Le bloc etait titre « Informations de debugging » : de la sortie de developpeur
         * laissee dans un ecran de comptabilite. Les memes valeurs disent en fait ce qui a
         * ete DEMANDE au serveur, ce qui est exactement l'information utile quand la
         * reponse est vide.
         */}
        {dateRange && (
          <Card>
            <Card.Header>
              <Card.Title className="text-sm">Période demandée</Card.Title>
            </Card.Header>
            <Card.Content className="gap-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Découpage</span>
                <span className="text-foreground">{periodLabels[selectedPeriod]}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Date de début</span>
                <span className="tabular-nums text-foreground">
                  {dateRange.from?.toISOString().split('T')[0] ?? 'Non renseignée'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Date de fin</span>
                <span className="tabular-nums text-foreground">
                  {dateRange.to?.toISOString().split('T')[0] ?? 'Non renseignée'}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Jours</span>
                <span className="tabular-nums text-foreground">
                  {dateRange.from && dateRange.to
                    ? Math.ceil(
                        (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24),
                      )
                    : 0}
                </span>
              </div>
            </Card.Content>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/*
       * L'en-tete basculait en colonnes a `lg:` (1024 px). La fenetre de l'operateur fait
       * environ 1000 px de large, coquille comprise : ce palier ne s'ouvrait jamais chez
       * lui et le titre restait empile au-dessus du filtre. Il passe a `md:`.
       */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="text-2xl font-bold text-foreground">Revenus par période</h2>
        <DateFilterInput
          filters={{ debut: dateRange?.from, fin: dateRange?.to }}
          handleDateChange={setDateRange}
        />
      </div>

      {(!revenueData?.data || revenueData.data.length === 0) && (
        <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-warning-soft-foreground">
          <Calendar aria-hidden="true" className="size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Aucun revenu</p>
            <p className="text-xs">Il n&#39;y a pas de revenus enregistrés pour cette période.</p>
          </div>
        </div>
      )}

      {/*
       * La carte du total etait un degrade `from-red-50 to-red-100` borde de rouge, avec le
       * montant lui-meme en rouge et un rond rouge portant un signe DOLLAR, pour des francs
       * CFA. Rien de tout cela ne disait quoi que ce soit : c'est le chiffre qu'on vient
       * lire, il se suffit, et il se lit mieux sur une surface neutre.
       */}
      <Card>
        <Card.Content className="gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Wallet aria-hidden="true" className="size-5 shrink-0 text-muted" />
                <h3 className="text-lg font-semibold text-foreground">
                  Revenu {periodLabels[selectedPeriod]}
                </h3>
              </div>
              <p className="mt-1 text-sm text-muted">{getPeriodDisplay()}</p>
              <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
                {formatCurrency(stats?.total || 0)}
              </p>
            </div>
          </div>

          {/* Quatre chiffres cote a cote : chasse tabulaire et alignement a droite, pour
              qu'ils se comparent au lieu de se lire un par un. */}
          <div className="grid grid-cols-2 gap-4 border-t border-separator pt-6 md:grid-cols-4">
            <div className="text-right">
              <p className="text-xs text-muted">Moyenne</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(stats?.average || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Maximum</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(stats?.max || 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Livraisons</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {stats?.deliveriesCount || 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Moyenne/Livraison</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(stats?.averagePerDelivery || 0)}
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-lg">
            Évolution des revenus, mois de{' '}
            {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {/*
           * La grille, les axes et l'infobulle etaient peints en dur (`#f0f0f0`, `#6b7280`,
           * un fond `white`), donc identiques en theme sombre : une infobulle blanche a
           * texte clair, illisible. `ChartContainer` habille les trois depuis le theme, a
           * condition de ne PAS forcer leur trait.
           */}
          <ChartContainer className="h-[400px] w-full" config={chartConfig}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis axisLine={false} dataKey="label" fontSize={12} tickLine={false} />
              <YAxis
                axisLine={false}
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                tickLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="value"
                dot={{ r: 3, strokeWidth: 2 }}
                stroke="var(--color-value)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
          <p className="text-xs text-muted">Axe vertical en milliers de FCFA.</p>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header className="flex-row items-center gap-2">
          <BarChart3 aria-hidden="true" className="size-5 shrink-0 text-muted" />
          <Card.Title className="text-lg">Comparaison mensuelle</Card.Title>
        </Card.Header>
        {/*
         * La carte DISPARAISSAIT entierement quand l'un des deux mois manquait a
         * l'historique : la page se refermait sur elle-meme sans que rien ne dise pourquoi,
         * et une panne de lecture ressemblait alors trait pour trait a un mois sans activite.
         * Elle reste toujours, et elle dit ce qui manque.
         */}
        <Card.Content>
          {isYearError ? (
            <EtatErreur onReessayer={() => refetchYear()} quoi="la comparaison mensuelle" />
          ) : monthlyComparison ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted">Mois précédent</p>
                  <p className="text-xs text-muted">{monthlyComparison.previousMonth.name}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                    {formatCurrency(monthlyComparison.previousMonth.revenue)}
                  </p>
                </div>

                {/*
                 * La fleche pointait TOUJOURS a droite, quel que soit le sens de l'ecart, et
                 * le pourcentage calcule n'etait affiche nulle part. Elle dit maintenant si
                 * le mois monte ou descend, et l'ecart est donne en francs ET en pourcentage.
                 */}
                <div className="flex flex-col items-center justify-center gap-1">
                  {monthlyComparison.change >= 0 ? (
                    <TrendingUp
                      aria-hidden="true"
                      className="size-6 text-success-soft-foreground"
                    />
                  ) : (
                    <TrendingDown
                      aria-hidden="true"
                      className="size-6 text-danger-soft-foreground"
                    />
                  )}
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      monthlyComparison.change >= 0
                        ? 'text-success-soft-foreground'
                        : 'text-danger-soft-foreground'
                    }`}
                  >
                    {monthlyComparison.change >= 0 ? '+' : ''}
                    {formatCurrency(monthlyComparison.change)}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    {monthlyComparison.change >= 0 ? '+' : '-'}
                    {monthlyComparison.changePercentage.toFixed(1)} %
                  </p>
                </div>

                <div className="md:text-right">
                  <p className="text-sm text-muted">Mois en cours</p>
                  <p className="text-xs text-muted">{monthlyComparison.currentMonth.name}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                    {formatCurrency(monthlyComparison.currentMonth.revenue)}
                  </p>
                </div>
              </div>

              <ChartContainer className="h-[120px] w-full" config={chartConfig}>
                <BarChart
                  data={[
                    {
                      name: monthlyComparison.previousMonth.name.substring(0, 3),
                      revenue: monthlyComparison.previousMonth.revenue,
                    },
                    {
                      name: monthlyComparison.currentMonth.name.substring(0, 3),
                      revenue: monthlyComparison.currentMonth.revenue,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis axisLine={false} dataKey="name" fontSize={12} tickLine={false} />
                  <YAxis
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              La comparaison demande les revenus du mois en cours ET du mois précédent :
              l&apos;historique de l&apos;année n&apos;en contient pas encore deux.
            </p>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
