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

import { calculerRetardParMois, calculerRetardParPartenaire } from './encours-derive';

/*
 * Les couleurs passent par les VARIABLES du theme et non par des hexadecimaux : recharts
 * pose ces valeurs en attributs SVG, ou `var(--x)` et `color-mix()` sont valides.
 *
 * POURQUOI CES BARRES SONT PEINTES ALORS QUE LES MEMES MONTANTS RESTENT NEUTRES AILLEURS
 *
 * La regle de cet ecran tient en deux points. D'abord, le rouge de marque a pleine force
 * appartient a ce qui est EN RETARD, parce que c'est la seule chose qui appelle un geste ;
 * un reste a payer est de l'argent du, pas forcement de l'argent en souffrance. C'est
 * pourquoi seule la carte « En retard » du bandeau est peinte, et pourquoi le reste a
 * payer se lit en graphite dans le bandeau, dans le releve et dans les cartes tactiles.
 *
 * Ensuite, un nombre ecrit n'est pas une barre. Un nombre a deja une couleur, celle du
 * texte : le peindre est un ACTE, donc reserve au retard. Une barre n'a aucun defaut, il
 * FAUT lui donner une teinte, et le gris n'en est pas une - il dit « secondaire ». La
 * famille du danger a force REDUITE dit « de l'argent du » sans pretendre que chaque barre
 * est une alerte, et laisse la pleine force disponible pour ce qu'elle designe partout
 * ailleurs sur cet ecran : la part en retard, empilee par-dessus. L'ecart avec les nombres
 * n'est donc pas une incoherence, c'est la meme regle appliquee a deux supports qui ne
 * partent pas du meme point.
 *
 * Le melange se fait vers `--surface`, jamais vers du blanc : en theme sombre la surface
 * est sombre, la barre s'assourdit au lieu de se delaver.
 */
const RESTE = 'color-mix(in oklab, var(--danger) 64%, var(--surface))';

/** La part en retard, a pleine force : c'est elle qui ordonne la relance. */
const RETARD = 'var(--danger)';

const GRILLE = 'var(--separator)';

/** Coins arrondis du HAUT de la pile (graphe mensuel) et de sa DROITE (classement). */
const COIN_HAUT: [number, number, number, number] = [4, 4, 0, 0];
const COIN_DROIT: [number, number, number, number] = [0, 4, 4, 0];
const PLAT: [number, number, number, number] = [0, 0, 0, 0];

/**
 * Les memes coins, pour une `Cell`.
 *
 * <p>Recharts etale les proprietes de la cellule sur le RECTANGLE, qui accepte bien les
 * quatre coins ; mais il type `Cell` en `SVGProps`, ou `radius` est l'attribut SVG, donc un
 * seul nombre. Le tableau est juste a l'execution et faux au typage. La conversion est donc
 * ici, nommee et expliquee une fois, plutot que repetee dans le JSX.</p>
 */
function coinsCellule(coins: [number, number, number, number]): number {
  return coins as unknown as number;
}

/*
 * Le classement ORDONNE un effort : le partenaire qui doit le plus est celui par lequel on
 * commence. La gradation dit ce rang dans la MEME teinte, du plus soutenu au plus doux ;
 * une teinte par partenaire ne dirait rien, la position dans la liste etant deja donnee.
 *
 * L'echelle est normalisee sur le nombre de barres et s'arrete a 40 % : a deux partenaires
 * comme a six, la derniere garde assez de teinte pour se lire sur le fond de la carte, en
 * clair comme en sombre. La longueur dit deja le rang, la teinte le REDIT - elle n'a donc
 * pas a s'effacer jusqu'a devenir un aplat. Le haut de l'echelle s'arrete sous la pleine
 * force, qui est reservee au segment de retard pose sur ces memes barres.
 */
function teinteRang(rang: number, total: number): string {
  const part = total > 1 ? Math.round(64 - (rang * 24) / (total - 1)) : 64;
  return `color-mix(in oklab, var(--danger) ${part}%, var(--surface))`;
}

/*
 * `--muted-foreground` est un jeton shadcn : il vaut « 0 0% 45.1% », un TRIPLET HSL nu
 * destine a `hsl(var(--x))`, pas une couleur. Pose tel quel dans un attribut `fill`, il
 * est invalide, la valeur initiale s'applique, et les graduations se peignent en NOIR :
 * illisibles en theme sombre. La chaine de repli ne rattrapait rien, puisque la variable
 * existe. `--muted` est le jeton HeroUI v3, et lui porte bien une couleur.
 *
 * Une graduation d'axe INFORME, elle n'appelle aucun geste : elle reste neutre.
 */
const GRADUATION = 'var(--muted)';

/*
 * Le classement ne montre que la tete : au-dela, les barres deviennent trop courtes pour
 * se comparer et le geste ne commence de toute facon pas la. L'onglet qui annonce ce
 * graphique compte les memes barres, d'ou la constante partagee.
 */
export const TOP_PARTENAIRES = 6;

/**
 * Decoupe un reste en « ce qui est en retard » et « le solde ».
 *
 * <p>Le reste vient du serveur, le retard est ventile depuis l'arbre des factures : deux
 * calculs, donc deux totaux qui peuvent ne pas coincider au franc pres (une deduction de
 * partenaire n'appartient a aucun mois). Sans borne, la pile depasserait le reste et le
 * graphique mentirait sur la hauteur. La part en retard cede donc devant le reste, jamais
 * l'inverse : c'est la hauteur totale qui doit rester juste.</p>
 */
function decouper(reste: number, retard: number) {
  const enRetard = Math.max(0, Math.min(retard, Math.max(reste, 0)));
  return { enRetard, horsRetard: reste - enRetard };
}

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
 * Une ligne de l'infobulle.
 *
 * <p>Les montants y sont des NOMBRES ECRITS : ils suivent donc la regle du haut de fichier
 * et restent neutres, sauf la part en retard, seule a etre peinte. Une infobulle qui
 * peindrait tout en rouge contredirait la pile qu'elle explique.</p>
 */
function LigneInfobulle({
  enRetard,
  libelle,
  valeur,
}: {
  enRetard?: boolean;
  libelle: string;
  valeur: number;
}) {
  return (
    <p className="flex justify-between gap-4 text-muted">
      <span>{libelle}</span>
      <span
        className={
          enRetard
            ? 'font-semibold tabular-nums text-danger-soft-foreground'
            : 'font-semibold tabular-nums text-foreground'
        }
      >
        {formatFcfa(valeur)}
      </span>
    </p>
  );
}

interface IPointMois {
  enRetard: number;
  facture: number;
  horsRetard: number;
  mois: string;
  reste: number;
}

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
  payload?: { payload: IPointMois }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={CADRE_INFOBULLE}>
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <LigneInfobulle libelle="Facturé" valeur={point.facture} />
      <LigneInfobulle libelle="Reste" valeur={point.reste} />
      {point.enRetard > 0 ? (
        <LigneInfobulle enRetard libelle="dont en retard" valeur={point.enRetard} />
      ) : null}
    </div>
  );
}

interface IPointTop {
  enRetard: number;
  horsRetard: number;
  nom: string;
  reste: number;
}

function InfobulleReste({
  active,
  payload,
  label,
}: {
  active?: boolean;
  label?: string;
  payload?: { payload: IPointTop }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className={CADRE_INFOBULLE}>
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      <LigneInfobulle libelle="Reste" valeur={point.reste} />
      {point.enRetard > 0 ? (
        <LigneInfobulle enRetard libelle="dont en retard" valeur={point.enRetard} />
      ) : null}
    </div>
  );
}

const CURSEUR = { fill: 'color-mix(in oklab, var(--foreground) 6%, transparent)' };

export function EncoursCharts({ releve }: { releve: IEncoursReleve }) {
  const retardMois = calculerRetardParMois(releve);
  const retardGroupe = calculerRetardParPartenaire(releve);

  const moisData: IPointMois[] = (releve.moisColonnes ?? []).map((m) => {
    const reste = releve.resteParMois?.[String(m)] ?? 0;
    const { enRetard, horsRetard } = decouper(reste, retardMois[String(m)] ?? 0);
    return {
      enRetard,
      facture: releve.factureParMois?.[String(m)] ?? 0,
      horsRetard,
      mois: MOIS_COURTS[m] ?? `M${m}`,
      reste,
    };
  });

  const topData: IPointTop[] = [...(releve.partenaires ?? [])]
    .sort((a, b) => b.sousTotalReste - a.sousTotalReste)
    .slice(0, TOP_PARTENAIRES)
    .map((p) => {
      const { enRetard, horsRetard } = decouper(p.sousTotalReste, retardGroupe[p.groupe] ?? 0);
      return { enRetard, horsRetard, nom: p.groupe, reste: p.sousTotalReste };
    });

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
            {/*
             * Deux barres EMPILEES, pas deux series : leur somme est le reste du mois, et
             * c'est cette somme que l'axe doit mesurer. L'arrondi appartient au sommet de
             * la pile, donc au segment de retard quand il existe ; sans lui, le socle le
             * reprend. Une valeur laissee a `undefined` sur une `Cell` ECRASERAIT celle de
             * la barre (recharts etale les proprietes de la cellule par-dessus), d'ou le
             * coin plat explicite.
             */}
            <Bar dataKey="horsRetard" fill={RESTE} maxBarSize={48} stackId="reste">
              {moisData.map((point) => (
                <Cell
                  key={point.mois}
                  radius={coinsCellule(point.enRetard > 0 ? PLAT : COIN_HAUT)}
                />
              ))}
            </Bar>
            <Bar
              dataKey="enRetard"
              fill={RETARD}
              maxBarSize={48}
              radius={COIN_HAUT}
              stackId="reste"
            />
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
            <Bar dataKey="horsRetard" maxBarSize={22} stackId="reste">
              {topData.map((entree, i) => (
                <Cell
                  fill={teinteRang(i, topData.length)}
                  key={entree.nom}
                  radius={coinsCellule(entree.enRetard > 0 ? PLAT : COIN_DROIT)}
                />
              ))}
            </Bar>
            <Bar
              dataKey="enRetard"
              fill={RETARD}
              maxBarSize={22}
              radius={COIN_DROIT}
              stackId="reste"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
