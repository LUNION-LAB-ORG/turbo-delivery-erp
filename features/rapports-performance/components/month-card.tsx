'use client';

import { Card, Chip, ProgressBar } from '@heroui-v3/react';
import { ArrowUpRight, Briefcase, PlusCircle, TrendingUp, Users, type LucideIcon } from 'lucide-react';

import CarteStat, { type TonStat } from '@/components/commons/CarteStat';

import { MonthData } from '../hooks/use-bilan-annuel';

interface MonthCardProps {
  month: MonthData;
}

/**
 * Le mois d'un bilan annuel.
 *
 * <h3>Ce qui change</h3>
 * <p>Les couleurs disaient toutes la meme chose : rien. Le nom du mois et les deux
 * compteurs etaient peints en ROUGE DE MARQUE, la couleur reservee au geste, alors
 * qu'ils n'appellent aucune action. Le resultat du mois etait peint en VERT quel que
 * soit son signe : un mois perdu s'affichait en vert, sous l'intitule « Benefice
 * mensuel ». La couleur suit desormais le signe, et l'intitule aussi.</p>
 *
 * <p>Les cinq montants etaient poses en colonnes cote a cote, alignes a gauche et en
 * chasse proportionnelle : ils ne tombaient pas sur la meme verticale d'un mois a
 * l'autre, donc ne se comparaient pas, et « 48 250 000 FCFA » se coupait en deux lignes.
 * Ils sont empiles, un par ligne, cales a droite en chasse tabulaire.</p>
 *
 * <p>La rupture de mise en page etait a `lg` (1024 px). La fenetre de l'operateur fait
 * environ 1000 px : elle ne s'ouvrait jamais, et la carte restait en une seule colonne
 * sur toute la hauteur. Elle est a `md`.</p>
 */

const MONTANTS: {
  cle: 'autresEntrees' | 'ca' | 'expenses' | 'investments' | 'reimbursements';
  icone?: LucideIcon;
  libelle: string;
}[] = [
  { cle: 'ca', icone: TrendingUp, libelle: 'CA' },
  { cle: 'autresEntrees', icone: PlusCircle, libelle: 'Autres entrées' },
  // L'intitule annoncait « % Depenses » sur une valeur qui est un MONTANT en francs,
  // jamais un pourcentage : l'intitule mentait sur ce qu'on lisait.
  { cle: 'expenses', libelle: 'Dépenses' },
  { cle: 'reimbursements', icone: ArrowUpRight, libelle: 'Remboursements' },
  { cle: 'investments', icone: Briefcase, libelle: 'Investissements' },
];

/**
 * Le signe porte deja l'information ; la couleur ne fait que la rendre lisible d'un coup
 * d'oeil. Zero n'est ni une bonne ni une mauvaise nouvelle : il reste neutre.
 */
function tonDuResultat(montantFormate: string): TonStat {
  if (montantFormate.startsWith('-')) return 'danger';
  if (montantFormate.startsWith('+')) return 'succes';
  return 'neutre';
}

function MoisCompteurs({ month }: MonthCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <CarteStat icone={TrendingUp} libelle="Courses" valeur={month.courses} />
      <CarteStat icone={Users} libelle="Staff" valeur={month.staff} />
    </div>
  );
}

function MoisMontants({ month }: MonthCardProps) {
  return (
    <>
      {/* Cinq montants poses cote a cote se coupaient au milieu du chiffre et
          repoussaient « 48 250 000 FCFA » sur deux lignes. Empiles, ils tombent tous sur
          la meme colonne a droite : c'est ce qui les rend comparables. */}
      <dl className="divide-y divide-separator">
        {MONTANTS.map(({ cle, icone: Icone, libelle }) => (
          <div className="flex items-center justify-between gap-4 py-1.5" key={cle}>
            <dt className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
              {Icone && <Icone aria-hidden="true" className="size-3 shrink-0" />}
              <span className="truncate">{libelle}</span>
            </dt>
            <dd className="shrink-0 text-sm font-semibold tabular-nums whitespace-nowrap text-foreground">
              {month[cle]}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Progression annuelle</span>
          <span className="tabular-nums text-muted">{month.progress}/12</span>
        </div>
        {/* Sans `color`, la v3 remplit en accent : le rouge de marque sur un simple
            avancement dans l'annee. */}
        <ProgressBar
          aria-label="Progression annuelle"
          className="h-2"
          color="default"
          value={(month.progress / 12) * 100}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </>
  );
}

function MoisRentabilite({ month }: MonthCardProps) {
  const tonMois = tonDuResultat(month.monthlyResult);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Rentabilité</h3>
      <CarteStat
        accent
        libelle="Résultat du mois"
        note={tonMois === 'danger' ? 'Perte mensuelle' : 'Bénéfice mensuel'}
        ton={tonMois}
        valeur={month.monthlyResult}
      />
      <CarteStat
        libelle="Rentabilité cumulée YTD"
        note={`Depuis : ${month.monthName}`}
        ton={tonDuResultat(month.cumulativeResult)}
        valeur={month.cumulativeResult}
      />
    </div>
  );
}

export function MonthCard({ month }: MonthCardProps) {
  return (
    <Card>
      <Card.Header className="flex-row items-center justify-between gap-3">
        <Card.Title className="text-lg font-bold text-foreground">{month.monthName}</Card.Title>
        {/* « Rentable » seul laissait son absence ambigue : mois deficitaire, ou mois sans
            chiffres ? Les deux etats sont nommes, et seuls les mois qui ont des chiffres
            portent une pastille. */}
        {month.hasData && (
          <Chip color={month.isProfitable ? 'success' : 'danger'} size="sm" variant="soft">
            {month.isProfitable ? 'Rentable' : 'Déficitaire'}
          </Chip>
        )}
      </Card.Header>

      <Card.Content className="gap-4 md:flex-row md:gap-6">
        <div className="flex min-w-0 flex-col gap-4 md:flex-1">
          <MoisCompteurs month={month} />
          {month.hasData ? (
            <MoisMontants month={month} />
          ) : (
            <p className="text-sm italic text-muted">Aucun chiffre pour ce mois</p>
          )}
        </div>
        {month.hasData && (
          <div className="md:w-64 md:shrink-0">
            <MoisRentabilite month={month} />
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
