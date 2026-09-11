'use client';

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@heroui-v3/react';
import { IGeographicLocation, IWeeklyActivity } from '@/features/rapports-performance/types/performance.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { formatNumber } from '@/utils/formatNumber';

interface ChartsSectionProps {
  geographicData: IGeographicLocation[];
  weeklyActivityData: IWeeklyActivity[];
}

/*
 * Les couleurs passent par les VARIABLES du theme, et non par des hexadecimaux : recharts
 * pose ces valeurs en attributs SVG, ou `var(--x)` et `color-mix()` sont valides.
 *
 * Ce fichier en portait trente en dur. Elles ne bougeaient pas avec le theme, et deux
 * d'entre elles cassaient l'ecran en sombre, chacune a sa facon. `#f3f4f6` est un gris
 * QUASI BLANC : pose en grille sur la carte blanche du theme clair il se devine a peine,
 * ce pour quoi il avait ete choisi, mais sur la carte sombre il devient un quadrillage
 * blanc qui crie plus fort que les barres qu'il sert a lire. L'infobulle, elle, avait son
 * fond ecrit a `#fff` : un rectangle blanc s'allumait au survol sous le texte clair que
 * recharts y pose.
 *
 * ⚠ NE PAS employer `--muted-foreground` ni les autres jetons shadcn dans un attribut SVG.
 * Ils valent « 0 0% 45.1% », un TRIPLET HSL nu destine a `hsl(var(--x))`, pas une couleur.
 * Pose tel quel dans un `fill`, il est invalide, la valeur initiale s'applique, et la
 * graduation se peint en NOIR sans lever la moindre erreur. `--muted` est le jeton HeroUI
 * v3, et lui porte bien une couleur.
 *
 * Le melange se fait vers `--surface`, jamais vers du blanc : en theme sombre la surface est
 * sombre, la part s'assourdit au lieu de se delaver.
 */

/** Une graduation d'axe INFORME, elle n'appelle aucun geste : elle reste neutre. */
const GRADUATION = 'var(--muted)';

const GRILLE = 'var(--separator)';

/*
 * Les deux series du graphe hebdomadaire, et pourquoi ces deux familles.
 *
 * Une barre n'a aucune couleur par defaut : lui en donner une n'est pas un acte, c'est une
 * obligation - et le gris n'est pas une teinte, il dit « secondaire ». Le choix se fait donc
 * ailleurs : les deux memes grandeurs sont deja peintes plus haut dans la page, sur les
 * cartes de tete, en `ton="danger"` pour les livraisons et `ton="attention"` pour le montant.
 * Les barres reprennent ces deux familles, faute de quoi la meme grandeur porterait deux
 * couleurs differentes sur le meme ecran.
 */
const LIVRAISONS = 'var(--danger)';
const MONTANT = 'var(--warning)';

const CADRE_INFOBULLE = 'rounded-md border border-separator bg-surface p-2 shadow-xs';

/*
 * Le voile de survol des barres. Laisse a lui-meme, recharts pose un `#ccc` a 40 % ecrit
 * dans sa propre source : un rectangle GRIS CLAIR sur un fond sombre, plus voyant que la
 * barre qu'il designe. Un voile se derive du texte de la page, il suit donc le theme.
 */
const CURSEUR = { fill: 'color-mix(in oklab, var(--foreground) 6%, transparent)' };

/*
 * Le camembert : UNE teinte, graduee par le RANG de la zone.
 *
 * Il alignait vingt hexadecimaux decoratifs - rouge, orange, jaune, vert, bleu, violet,
 * rose... - dont dix au plus etaient atteignables, la requete du serveur etant bornee a
 * `LIMIT 10`. Vingt teintes ne disent rien : elles distinguent vingt zones que les etiquettes
 * nomment deja. Ce qu'on cherche dans une repartition, c'est le RANG, et une gradation d'une
 * seule teinte le dit - la premiere zone est la plus soutenue, la derniere la plus douce.
 *
 * L'echelle est normalisee sur le nombre de parts et s'arrete a 40 % : a trois zones comme a
 * dix, la derniere garde assez de teinte pour se lire sur la carte, en clair comme en sombre.
 * C'est le plancher MESURE du modele `encours-charts.tsx`, pas un chiffre au juge - en
 * dessous, la derniere part se confond avec la surface en clair comme en sombre.
 */
function teinteRang(rang: number, total: number): string {
  const part = total > 1 ? Math.round(82 - (rang * 42) / (total - 1)) : 82;

  return `color-mix(in oklab, var(--danger) ${part}%, var(--surface))`;
}

interface GeographicTooltipPayload {
  payload?: IGeographicLocation;
}

interface WeeklyTooltipPayload {
  payload?: IWeeklyActivity;
}

/**
 * Une ligne de la legende du camembert : pastille, nom de zone, part.
 *
 * <p>Les noms etaient poses en ETIQUETTES autour du donut, tronques a 14 caracteres et
 * suivis de points de suspension. A dix zones - la limite de la requete - ils se
 * chevauchaient et devenaient illisibles : « Lubafrique ple... », « Rue du Pont de... »,
 * « M'badon, Abidj... » se croisaient sur trois lignes, et aucun nom n'etait entier.</p>
 *
 * <p>La legende les remet a plat, dans l'ordre des parts. Le nom peut encore etre coupe
 * faute de place, mais par le navigateur, sur un texte qui reste selectionnable et dont
 * `title` porte la version entiere - ce qu'une troncature a la main dans un `<text>` SVG
 * ne permet pas.</p>
 */
function LigneLegende({
  nom,
  part,
  teinte,
  livraisons,
}: {
  nom: string;
  part: string;
  teinte: string;
  livraisons: number;
}) {
  return (
    <li className="flex items-center gap-2.5 text-xs">
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: teinte }}
      />
      <span className="min-w-0 flex-1 truncate text-foreground" title={nom}>
        {nom}
      </span>
      <span className="shrink-0 tabular-nums text-muted" title={`${livraisons} livraisons`}>
        {part}
      </span>
    </li>
  );
}

/**
 * Une ligne de l'infobulle hebdomadaire.
 *
 * <p>La pastille reprend la couleur de la barre : sans elle, deux nombres se suivent sans
 * dire lequel appartient a quelle serie. Le nombre, lui, reste NEUTRE - le peindre serait un
 * acte, et il n'appelle aucun geste. Les valeurs se comparent d'une ligne a l'autre, d'ou
 * `tabular-nums` et l'alignement a droite.</p>
 */
function LigneInfobulle({ libelle, teinte, valeur }: { libelle: string; teinte: string; valeur: string }) {
  return (
    <p className="flex items-center justify-between gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: teinte }} />
        {libelle}
      </span>
      <span className="font-semibold tabular-nums text-foreground">{valeur}</span>
    </p>
  );
}

export function ChartsSection({ geographicData, weeklyActivityData }: ChartsSectionProps) {
  /*
   * La teinte dit le rang : encore faut-il que l'ordre soit vrai. Le serveur trie deja par
   * livraisons decroissantes et la page s'appuyait dessus pour annoncer la « Zone Top » sans
   * jamais le verifier. Le tri est refait ici, une fois, pour que la couleur ne puisse pas
   * mentir si la source change d'avis. Rien n'est retire : les memes zones, dans leur ordre.
   */
  const zonesParRang = [...geographicData].sort((a, b) => b.deliveries - a.deliveries);

  /*
   * La part de chaque zone, calculee sur `value` - LA MEME CLE que celle qui dessine les
   * arcs (`dataKey="value"`). La calculer sur `deliveries`, qui est l'autre nombre du jeu,
   * donnerait une legende ou 28 % designerait un arc qui en occupe 31 : deux grandeurs
   * proches, jamais egales, et l'ecart ne se verrait qu'a la loupe.
   */
  const totalParts = zonesParRang.reduce((t, z) => t + (z.value ?? 0), 0);
  const partDeZone = (zone: IGeographicLocation): string =>
    totalParts > 0 ? `${Math.round(((zone.value ?? 0) / totalParts) * 100)} %` : '—';

  const renderGeographicTooltip = ({ active, payload }: { active?: boolean; payload?: GeographicTooltipPayload[] }) => {
    if (!active || !payload?.length || !payload[0]?.payload) {
      return null;
    }

    const zone = payload[0].payload;

    return (
      <div className={CADRE_INFOBULLE}>
        <p className="text-xs font-medium text-foreground">{zone.name}</p>
        <p className="text-xs text-muted">{zone.deliveries} livraisons</p>
      </div>
    );
  };

  /*
   * L'infobulle du graphe hebdomadaire etait habillee par `contentStyle`, en dur : fond
   * `#fff`, bordure `#e5e7eb`. En sombre, un cadre blanc s'allumait au survol sous le texte
   * clair de la page : blanc sur blanc. Elle prend desormais le meme cadre que celle du
   * camembert, a cote, et nomme ses deux series au lieu de les numeroter.
   */
  const renderWeeklyTooltip = ({
    active,
    label,
    payload,
  }: {
    active?: boolean;
    label?: string;
    payload?: WeeklyTooltipPayload[];
  }) => {
    if (!active || !payload?.length || !payload[0]?.payload) {
      return null;
    }

    const jour = payload[0].payload;

    return (
      <div className={CADRE_INFOBULLE}>
        <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
        <LigneInfobulle libelle="Livraisons" teinte={LIVRAISONS} valeur={formatNumber(jour.deliveries)} />
        <LigneInfobulle
          libelle="Chiffre d'affaires généré"
          teinte={MONTANT}
          valeur={formatCFA(Math.round(jour.revenue))}
        />
      </div>
    );
  };

  /*
   * Le donut et sa legende, COTE A COTE.
   *
   * Le camembert ne porte plus aucune etiquette : `label` posait un `<text>` par part, et
   * a dix parts ils se chevauchaient. Les noms sont desormais dans la liste a droite, qui
   * a de la place pour les ecrire, les ordonne par rang - le meme ordre que les arcs, dans
   * le meme sens - et porte la pastille qui relie chaque ligne a son arc.
   *
   * La liste defile au-dela de sa hauteur plutot que de pousser la carte : les deux cartes
   * de cette rangee sont cote a cote et doivent garder la meme hauteur.
   */
  const renderDonutChart = () => (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="w-full shrink-0 sm:w-[190px]">
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={zonesParRang}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={82}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {zonesParRang.map((zone, index) => (
                <Cell key={`${index}-${zone.name}`} fill={teinteRang(index, zonesParRang.length)} />
              ))}
            </Pie>
            <RechartsTooltip content={renderGeographicTooltip} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="max-h-[190px] w-full min-w-0 space-y-2 overflow-y-auto sm:flex-1">
        {zonesParRang.map((zone, index) => (
          <LigneLegende
            key={`${index}-${zone.name}`}
            livraisons={zone.deliveries}
            nom={zone.name}
            part={partDeZone(zone)}
            teinte={teinteRang(index, zonesParRang.length)}
          />
        ))}
      </ul>
    </div>
  );

  // La colonne `revenue` somme le prix des commandes terminees : sur avril 2026 pour
  // PLATO, ses barres totalisent 276 500 F, le nombre exact de la carte de tete. La
  // legende disait « Chiffre d'affaires » quand la carte du meme nom en montrait un autre,
  // pollue par les entrees de caisse globales. Un seul nom, pour un seul nombre.
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={weeklyActivityData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRILLE} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: GRADUATION, fontSize: 12 }} />
        {/* « k » veut dire millier : la graduation divisait par 100 000 et etiquetait
            50 000 F en « 1k ». Le facteur est celui du suffixe. */}
        {/* DEUX AXES, ET C'EST NECESSAIRE, pas un ornement. Les deux series n'ont pas
            le meme ordre de grandeur : sur PLATO en avril 2026, les livraisons vont de 1 a
            6 quand les montants vont de 9 500 a 98 500 F. Sur un axe commun, la serie des
            livraisons est ecrasee a zero et devient invisible, alors que la legende juste
            en dessous la promet. Chaque serie porte donc sa propre echelle, et l'axe qui
            la gradue est du meme cote que sa barre. */}
        <YAxis axisLine={false} tick={{ fill: GRADUATION, fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tickLine={false} yAxisId="montant" />
        <YAxis allowDecimals={false} axisLine={false} orientation="right" tick={{ fill: GRADUATION, fontSize: 12 }} tickLine={false} yAxisId="livraisons" />
        <RechartsTooltip content={renderWeeklyTooltip} cursor={CURSEUR} />
        <Bar dataKey="deliveries" fill={LIVRAISONS} name="Livraisons" radius={[4, 4, 0, 0]} yAxisId="livraisons" />
        <Bar dataKey="revenue" fill={MONTANT} name="Chiffre d'affaires généré (FCFA)" radius={[4, 4, 0, 0]} yAxisId="montant" />
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
              Zone Top: {zonesParRang[0]?.name ?? 'N/A'} ({zonesParRang[0]?.deliveries ?? 0} livraisons)
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
            {/* La legende NOMME la barre : elle prend la MEME constante, sinon les deux
                derivent. `bg-red-500` et `bg-orange-500` etaient deux palettes brutes de
                plus, figees hors du theme, posees a cote de deux barres hexadecimales. */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: LIVRAISONS }}></div>
              <span className="text-sm text-muted">Livraisons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: MONTANT }}></div>
              <span className="text-sm text-muted">Chiffre d&#39;affaires généré (FCFA)</span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
