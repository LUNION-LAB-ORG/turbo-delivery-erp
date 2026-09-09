'use client';

import { Card } from '@heroui-v3/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Trophy } from 'lucide-react';
import { IEncoursReleve, MOIS_COURTS, formatCompact, formatFcfa } from '@/features/encours';

/*
 * Les couleurs des graphiques passent par les VARIABLES du theme et non par des
 * hexadecimaux. Recharts pose ces valeurs en attributs SVG, ou `var(--x)` est valide.
 *
 * Elles ne passent PLUS par `var(--accent)`, le rouge de marque. Un graphique se lit, il
 * n'appelle aucun geste : douze barres rouges en haut d'un ecran de recouvrement usent la
 * seule couleur qui doit encore signifier quelque chose quand une facture est en retard.
 * Le graphite tient les deux themes, la barre de tete se distingue par la DENSITE.
 */
const BARRE = 'color-mix(in oklab, var(--foreground) 62%, var(--surface))';
const BARRE_DOUCE = 'color-mix(in oklab, var(--foreground) 28%, var(--surface))';
const GRILLE = 'var(--separator)';
/*
 * `--muted-foreground` est un jeton shadcn : il vaut « 0 0% 45.1% », un TRIPLET HSL nu
 * destine a `hsl(var(--x))`, pas une couleur. Pose tel quel dans un attribut `fill`, il
 * est invalide, la valeur initiale s'applique, et les graduations se peignent en NOIR :
 * illisibles en theme sombre. La chaine de repli ne rattrapait rien, puisque la variable
 * existe. `--muted` est le jeton HeroUI v3, et lui porte bien une couleur.
 */
const GRADUATION = 'var(--muted)';

function ChartCard({
  title,
  icon: Icon,
  hasData,
  children,
}: {
  title: string;
  icon: typeof BarChart3;
  hasData: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Card.Content className="gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon aria-hidden="true" className="size-4 text-muted" />
          {title}
        </span>
        {hasData ? (
          <div className="h-[150px] w-full">{children}</div>
        ) : (
          <div className="flex h-[150px] items-center justify-center text-sm text-muted">
            Aucun reste à payer pour cette sélection.
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

const CADRE_INFOBULLE =
  'rounded-lg border border-separator bg-surface px-2.5 py-2 text-xs shadow-md';

/**
 * L'infobulle du graphe mensuel montre le FACTURE a cote du reste.
 *
 * <p>`factureParMois` etait dans la charge utile et ne s'affichait nulle part : une barre
 * de reste seule ne dit pas si le mois a peu facture ou mal encaisse. C'est exactement
 * l'ordre de grandeur qui manquait pour lire la serie.</p>
 */
function InfobulleMois({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: { payload: { facture: number; reste: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={CADRE_INFOBULLE}>
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <p className="flex justify-between gap-4 text-muted">
        <span>Facturé</span>
        <span className="tabular-nums text-foreground">{formatFcfa(point.facture)}</span>
      </p>
      <p className="flex justify-between gap-4 text-muted">
        <span>Reste</span>
        <span className="font-semibold tabular-nums text-foreground">{formatFcfa(point.reste)}</span>
      </p>
    </div>
  );
}

function InfobulleReste({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className={CADRE_INFOBULLE}>
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <p className="flex justify-between gap-4 text-muted">
        <span>Reste</span>
        <span className="font-semibold tabular-nums text-foreground">
          {formatFcfa(payload[0].value)}
        </span>
      </p>
    </div>
  );
}

const CURSEUR = { fill: 'color-mix(in oklab, var(--foreground) 6%, transparent)' };

export function EncoursCharts({ releve }: { releve: IEncoursReleve }) {
  const moisData = (releve.moisColonnes ?? []).map((m) => ({
    facture: releve.factureParMois?.[String(m)] ?? 0,
    mois: MOIS_COURTS[m] ?? `M${m}`,
    reste: releve.resteParMois?.[String(m)] ?? 0,
  }));

  const topData = [...(releve.partenaires ?? [])]
    .sort((a, b) => b.sousTotalReste - a.sousTotalReste)
    .slice(0, 6)
    .map((p) => ({ nom: p.groupe, reste: p.sousTotalReste }));

  return (
    // Le seuil `lg` (1024 px) ne s'ouvre jamais sur la fenetre reelle des postes, qui fait
    // 1000 px : les deux graphes restaient l'un sous l'autre, soit 400 px de haut.
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <ChartCard hasData={moisData.length > 0} icon={BarChart3} title="Encours par mois">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={moisData} margin={{ bottom: 0, left: 4, right: 8, top: 6 }}>
            <CartesianGrid stroke={GRILLE} strokeDasharray="3 3" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="mois"
              tick={{ fill: GRADUATION, fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: GRADUATION, fontSize: 11 }}
              tickFormatter={(v) => formatCompact(v)}
              tickLine={false}
              width={44}
            />
            <Tooltip content={<InfobulleMois />} cursor={CURSEUR} />
            <Bar dataKey="reste" fill={BARRE} maxBarSize={48} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        hasData={topData.length > 0}
        icon={Trophy}
        title="Top partenaires par reste à payer"
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={topData} layout="vertical" margin={{ bottom: 0, left: 4, right: 12, top: 4 }}>
            <CartesianGrid horizontal={false} stroke={GRILLE} strokeDasharray="3 3" />
            <XAxis
              axisLine={false}
              tick={{ fill: GRADUATION, fontSize: 11 }}
              tickFormatter={(v) => formatCompact(v)}
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="nom"
              tick={{ fill: 'var(--foreground)', fontSize: 11 }}
              tickLine={false}
              type="category"
              width={108}
            />
            <Tooltip content={<InfobulleReste />} cursor={CURSEUR} />
            <Bar dataKey="reste" maxBarSize={22} radius={[0, 4, 4, 0]}>
              {topData.map((_, i) => (
                <Cell fill={i === 0 ? BARRE : BARRE_DOUCE} key={topData[i].nom} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
