'use client';

import { Card, Spinner } from '@heroui-v3/react';
import { TrendingUp } from 'lucide-react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import EtatErreur from '@/components/commons/EtatErreur';
import { useDepenseSummaryQuery } from '@/features/depenses/queries/depense-summary.query';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/*
 * Les deux parts etaient peintes en VERT et en ORANGE. Le vert de cet ERP dit « c'est
 * bon », l'orange « attention » : une depense recurrente n'est ni l'un ni l'autre, c'est
 * une categorie comptable. Deux teintes distinctes restent necessaires,
 * puisque c'est la seule clef qui relie une part a son libelle, mais elles ne portent
 * plus de verdict.
 */
const TEINTES = {
  nonRecurrentes: '#8b5cf6',
  recurrentes: '#3b82f6',
} as const;

interface DepenseSummaryPieChartTableProps {
  categoriesDepense?: string[] | null;
  className?: string;
  debut?: Date;
  fin?: Date;
}

/**
 * La part des depenses recurrentes sur la periode.
 *
 * <h3>Ce qui change</h3>
 * <p>Les deux totaux sous le graphique tenaient dans des pastilles `bg-green-50` et
 * `bg-amber-50`, avec trois nuances de texte chacune et AUCUNE variante sombre : en theme
 * sombre, du texte vert clair sur un fond vert tres clair, illisible. Les totaux se posent
 * sur la surface du theme ; la couleur ne subsiste que sur la pastille qui relie la ligne
 * a sa part du camembert.</p>
 *
 * <p>Les deux montants etaient centres, en chasse proportionnelle. Ils existent pour etre
 * COMPARES l'un a l'autre : ils sont alignes a droite, en chasse tabulaire, et le
 * pourcentage se lit sous eux.</p>
 */
export function DepenseSummaryPieChartTable({
  categoriesDepense,
  className,
  debut,
  fin,
}: DepenseSummaryPieChartTableProps) {
  const { data, error, isError, isFetching, isLoading, refetch } = useDepenseSummaryQuery({
    categoriesDepense: categoriesDepense || undefined,
    debut,
    fin,
  });

  const donneesGraphique = data
    ? [
        { color: TEINTES.recurrentes, name: 'Récurrentes', value: data.totalRecurrentes },
        { color: TEINTES.nonRecurrentes, name: 'Non Récurrentes', value: data.totalNonRecurrentes },
      ]
    : [];

  const InfoBulle = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-separator bg-surface p-3 shadow-lg">
          <p className="font-medium text-foreground">{payload[0].name}</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: payload[0].payload.color }}>
            {formatCFA(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const Etiquette = ({ cx, cy, innerRadius, midAngle, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const rayon = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + rayon * Math.cos(-midAngle * RADIAN);
    const y = cy + rayon * Math.sin(-midAngle * RADIAN);

    // Sous 5 %, l'etiquette deborde de sa part et se pose sur la voisine.
    if (percent < 0.05) return null;

    return (
      <text
        className="text-sm font-semibold"
        dominantBaseline="central"
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        x={x}
        y={y}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const entete = (
    <Card.Header>
      <Card.Title className="flex items-center gap-2">
        <TrendingUp aria-hidden="true" className="size-5 text-muted" />
        Répartition des dépenses
      </Card.Title>
    </Card.Header>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        {entete}
        <Card.Content>
          <div className="flex h-80 items-center justify-center">
            <Spinner size="lg" />
          </div>
        </Card.Content>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        {entete}
        <Card.Content>
          {/* Le message gris precedent n'offrait aucune reprise : l'operateur restait
              devant un graphique absent sans savoir quoi en faire. */}
          <div className="flex h-80 items-center justify-center">
            <EtatErreur
              detail={isError && error instanceof Error ? error.message : undefined}
              enCours={isFetching}
              onReessayer={() => refetch()}
              quoi="la répartition des dépenses"
            />
          </div>
        </Card.Content>
      </Card>
    );
  }

  const total = data.totalRecurrentes + data.totalNonRecurrentes;
  const part = (valeur: number) => (total > 0 ? ((valeur / total) * 100).toFixed(1) : '0');

  return (
    <Card className={className}>
      {entete}
      <Card.Content>
        <div className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                aria-label="Répartition des dépenses entre récurrentes et non récurrentes"
                cx="50%"
                cy="50%"
                data={donneesGraphique}
                dataKey="value"
                label={Etiquette}
                labelLine={false}
                outerRadius={100}
                role="img"
              >
                {donneesGraphique.map((tranche) => (
                  <Cell
                    aria-label={`${tranche.name}: ${formatCFA(tranche.value)}`}
                    fill={tranche.color}
                    key={tranche.name}
                  />
                ))}
              </Pie>
              <Tooltip content={<InfoBulle />} />
              <Legend
                aria-label="Légende du graphique de répartition des dépenses"
                formatter={(value, entry: any) => (
                  <span className="text-foreground">
                    {value}: <span className="tabular-nums">{formatCFA(entry.payload.value)}</span>
                  </span>
                )}
                height={36}
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {donneesGraphique.map((ligne) => (
            <div
              className="rounded-lg border border-separator bg-surface-secondary p-3"
              key={ligne.name}
            >
              <p className="flex items-center gap-2 text-sm text-muted">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: ligne.color }}
                />
                {ligne.name}
              </p>
              <p className="mt-1 text-right text-lg font-semibold tabular-nums text-foreground">
                {formatCFA(ligne.value)}
              </p>
              <p className="text-right text-xs tabular-nums text-muted">{part(ligne.value)}%</p>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
