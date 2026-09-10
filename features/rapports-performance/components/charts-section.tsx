'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@heroui-v3/react';
import { IGeographicLocation, IWeeklyActivity } from '@/features/rapports-performance/types/performance.type';

interface ChartsSectionProps {
  geographicData: IGeographicLocation[];
  weeklyActivityData: IWeeklyActivity[];
}

const DONUT_COLORS = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#06B6D4', // cyan-500
  '#F43F5E', // rose-500
  '#84CC16', // lime-500
  '#A855F7', // purple-500
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#6366F1', // indigo-500
  '#0EA5E9', // sky-500
  '#D946EF', // fuchsia-500
  '#FB7185', // rose-400
  '#34D399', // emerald-400
  '#60A5FA', // blue-400
];

const MAX_ZONE_LABEL_CHARS = 14;

interface GeographicLabelProps {
  x?: number;
  y?: number;
  name?: string;
}

interface GeographicTooltipPayload {
  payload?: IGeographicLocation;
}

function truncateZoneName(value: string, maxChars = MAX_ZONE_LABEL_CHARS): string {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}...`;
}

export function ChartsSection({ geographicData, weeklyActivityData }: ChartsSectionProps) {
  const renderGeographicLabel = ({ x = 0, y = 0, name = '' }: GeographicLabelProps) => {
    if (!name) {
      return null;
    }

    return (
      <text x={x} y={y} fill="#6b7280" fontSize={11} textAnchor="middle" dominantBaseline="central">
        {truncateZoneName(name)}
      </text>
    );
  };

  const renderGeographicTooltip = ({ active, payload }: { active?: boolean; payload?: GeographicTooltipPayload[] }) => {
    if (!active || !payload?.length || !payload[0]?.payload) {
      return null;
    }

    const zone = payload[0].payload;

    return (
      <div className="rounded-md border border-separator bg-surface p-2 shadow-xs">
        <p className="text-xs font-medium text-foreground">{zone.name}</p>
        <p className="text-xs text-muted">{zone.deliveries} livraisons</p>
      </div>
    );
  };

  const renderDonutChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={geographicData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          labelLine={false}
          label={renderGeographicLabel}
        >
          {geographicData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
          ))}

        </Pie>
        <RechartsTooltip content={renderGeographicTooltip} />
      </PieChart>
    </ResponsiveContainer>
  );

  // La colonne `revenue` somme le prix des commandes terminees : sur avril 2026 pour
  // PLATO, ses barres totalisent 276 500 F, le nombre exact de la carte de tete. La
  // legende disait « Chiffre d'affaires » quand la carte du meme nom en montrait un autre,
  // pollue par les entrees de caisse globales. Un seul nom, pour un seul nombre.
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={weeklyActivityData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
        {/* « k » veut dire millier : la graduation divisait par 100 000 et etiquetait
            50 000 F en « 1k ». Le facteur est celui du suffixe. */}
        {/* DEUX AXES, ET C'EST NECESSAIRE, pas un ornement. Les deux series n'ont pas
            le meme ordre de grandeur : sur PLATO en avril 2026, les livraisons vont de 1 a
            6 quand les montants vont de 9 500 a 98 500 F. Sur un axe commun, la serie des
            livraisons est ecrasee a zero et devient invisible, alors que la legende juste
            en dessous la promet. Chaque serie porte donc sa propre echelle, et l'axe qui
            la gradue est du meme cote que sa barre. */}
        <YAxis axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tickLine={false} yAxisId="montant" />
        <YAxis allowDecimals={false} axisLine={false} orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} yAxisId="livraisons" />
        <RechartsTooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Bar dataKey="deliveries" fill="#EF4444" name="Livraisons" radius={[4, 4, 0, 0]} yAxisId="livraisons" />
        <Bar dataKey="revenue" fill="#F97316" name="Chiffre d'affaires généré (FCFA)" radius={[4, 4, 0, 0]} yAxisId="montant" />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    // `lg:` vaut 1024 px et la fenetre reelle du poste en fait environ 1000 : la grille
    // ne s'ouvrait jamais et les deux graphiques restaient empiles l'un sous l'autre.
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card>
        <Card.Content className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground">Répartition Géographique</h2>
            <p className="text-sm text-muted">
              Zone Top: {geographicData[0]?.name ?? 'N/A'} ({geographicData[0]?.deliveries ?? 0} livraisons)
            </p>
          </div>
          {renderDonutChart()}
        </Card.Content>
      </Card>

      <Card>
        <Card.Content className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-foreground">Pics d&#39;Activité Hebdomadaire</h2>
            {/*<p className="text-sm text-muted">*/}
            {/*  Jour de Pic: <span className="font-medium">Dimanche</span> - 55% des livraisons vers Marcory*/}
            {/*</p>*/}
          </div>
          {renderBarChart()}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-muted">Livraisons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm text-muted">Chiffre d&#39;affaires généré (FCFA)</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
