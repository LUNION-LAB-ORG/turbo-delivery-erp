'use client';

import { Card } from '@heroui-v3/react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { IStatistiqueJour } from '@/features/creneaux/types/creneau.types';
import { getJourLabel } from '@/features/creneaux/utils/semaine.utils';

/**
 * La presence jour par jour d'une semaine de creneaux.
 *
 * <h3>Ce qui change</h3>
 * <p>La carte venait de la SECONDE bibliotheque de composants ; c'est celle de la
 * bibliotheque unique.</p>
 *
 * <p>Les trois seuils de presence etaient peints en `bg-green-50` / `bg-orange-50` /
 * `bg-red-50`, des couleurs de palette brute sans variante sombre : sur un poste en theme
 * sombre, les sept lignes restaient sur un fond clair avec un texte clair par-dessus. Les
 * memes trois seuils passent aux jetons d'etat, qui suivent le theme.</p>
 *
 * <p>Les pourcentages se comparent d'une ligne a l'autre : chasse tabulaire, pour que les
 * chiffres restent colonne sur colonne.</p>
 *
 * <p>Le graphique reste un habillage de recharts : la bibliotheque de composants n'a pas
 * de graphique.</p>
 */

const chartConfig = {
  pourcentage: {
    label: 'Présence',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

/** Trois seuils, trois etats : ce qui tient, ce qui glisse, ce qui manque. */
function tonDuSeuil(pourcentage: number) {
  if (pourcentage >= 80) return { fond: 'bg-success/10', texte: 'text-success-soft-foreground' };
  if (pourcentage >= 50) return { fond: 'bg-warning/10', texte: 'text-warning-soft-foreground' };
  return { fond: 'bg-danger/10', texte: 'text-danger-soft-foreground' };
}

function JourStatItem({ item }: { item: IStatistiqueJour }) {
  const ton = tonDuSeuil(item.pourcentage);

  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg p-3 ${ton.fond}`}>
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">
          {getJourLabel(item.jour)} {new Date(item.date).getDate()}
        </span>
        <span className="text-xs text-muted tabular-nums">
          Présents : {item.presents}/{item.total}
        </span>
      </div>
      <span className={`shrink-0 text-xl font-bold tabular-nums ${ton.texte}`}>{item.pourcentage}%</span>
    </div>
  );
}

interface StatistiquesParJourProps {
  data: IStatistiqueJour[];
}

export function StatistiquesParJour({ data }: StatistiquesParJourProps) {
  const chartData = data.map((item) => ({
    jour: getJourLabel(item.jour).slice(0, 3),
    pourcentage: item.pourcentage,
  }));

  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-base">Statistiques par jour</Card.Title>
      </Card.Header>
      <Card.Content className="gap-2">
        {data.map((item) => (
          <JourStatItem key={item.jour} item={item} />
        ))}

        {data.length > 0 && (
          <div className="pt-4">
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="jour" width={40} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="pourcentage" fill="var(--color-pourcentage)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
