'use client';

import { ArrowDown, ArrowRight, ArrowUp, Minus } from 'lucide-react';
import React from 'react';

import { Chip } from '@heroui-v3/react';

import { cn } from '@/lib/utils';
import type {
  IComparaisonLigne,
  IEcartIndicateurs,
  ILigneClassement,
  ITotauxClassement,
} from '@/features/classement-partenaires/types/classement.types';
import {
  ABSENT,
  montant,
  nombre,
  pourcentageSigne,
  valeurSignee,
} from '@/features/classement-partenaires/utils/classement-format.utils';

/**
 * DEUX PERIODES COTE A COTE.
 *
 * <h3>Le sens des ecarts, une fois pour toutes</h3>
 * <p>`A` est la periode de REFERENCE, la plus ancienne ; `B` la periode comparee. Tous les
 * ecarts valent `B moins A` et sont calcules PAR LE SERVEUR. Le front n'en soustrait aucun :
 * deux ecrans qui calculeraient la meme difference pourraient la calculer dans deux sens
 * opposes, et rien ne le dirait.</p>
 *
 * <p>⚠ Le RANG fait exception au signe apparent : `ecarts.rang` vaut
 * `rangReference - rangRecent`, donc il est POSITIF quand le partenaire gagne des places
 * alors que son numero de rang BAISSE. C'est le seul indicateur dont « monter » veut dire
 * « diminuer », et c'est pour cela qu'il est ecrit en places et non en points.</p>
 *
 * <h3>Un partenaire present d'un seul cote reste dans la liste</h3>
 * <p>C'est souvent l'information la plus interessante de l'ecran : une arrivee, ou une
 * disparition. Son ecart est alors nul et NON zero, parce qu'un ecart contre une periode ou
 * le partenaire n'existait pas serait une chute ou une envolee fictive.</p>
 */

/** Une cellule qui porte les deux periodes et leur ecart, dans cet ordre de lecture. */
export function CelluleAB({
  a,
  b,
  ecart,
  formateur,
  pct,
}: {
  a: number | null | undefined;
  b: number | null | undefined;
  ecart: number | null;
  formateur: (n: number | null | undefined) => string;
  pct?: number | null;
}) {
  const ton =
    ecart === null || ecart === 0
      ? 'text-muted'
      : ecart > 0
        ? 'text-green-800 dark:text-green-400'
        : 'text-red-800 dark:text-red-400';

  return (
    <span className="block">
      <span className="block font-semibold tabular-nums text-foreground">{formateur(b)}</span>
      <span className="block text-[11px] tabular-nums text-muted">
        {formateur(a)}
        <ArrowRight aria-hidden="true" className="mx-0.5 inline size-2.5" />
        <span className={ton}>
          {valeurSignee(ecart, (v) => formateur(v))}
          {pct !== null && pct !== undefined ? ` (${pourcentageSigne(pct)})` : ''}
        </span>
      </span>
    </span>
  );
}

/** Le mouvement de rang entre les deux periodes, en PLACES. Voir le bloc de tete. */
function MouvementRang({ ecarts, a, b }: { ecarts: IEcartIndicateurs | null; a: ILigneClassement | null; b: ILigneClassement | null }) {
  if (!ecarts || ecarts.rang === null) {
    return (
      <span className="block">
        <span className="block font-semibold tabular-nums text-foreground">{b ? b.rang : ABSENT}</span>
        <span className="block text-[11px] tabular-nums text-muted">
          {a ? `${a.rang}` : ABSENT}
          <ArrowRight aria-hidden="true" className="mx-0.5 inline size-2.5" />
          {ABSENT}
        </span>
      </span>
    );
  }

  const stable = ecarts.rang === 0;
  const hausse = ecarts.rang > 0;
  const Fleche = stable ? Minus : hausse ? ArrowUp : ArrowDown;
  const ton = stable
    ? 'text-muted'
    : hausse
      ? 'text-green-800 dark:text-green-400'
      : 'text-red-800 dark:text-red-400';

  return (
    <span className="block">
      <span className="block font-semibold tabular-nums text-foreground">{b?.rang ?? ABSENT}</span>
      <span className={cn('inline-flex items-center gap-0.5 text-[11px] tabular-nums', ton)}>
        <Fleche aria-hidden="true" className="size-2.5 shrink-0" />
        {stable
          ? 'même rang'
          : `${hausse ? '+' : ''}${ecarts.rang} place${Math.abs(ecarts.rang) > 1 ? 's' : ''}`}
      </span>
    </span>
  );
}

export interface ColonneComparaison {
  cle: string;
  libelle: string;
  nombre?: boolean;
  rendu: (ligne: IComparaisonLigne) => React.ReactNode;
}

/*
 * Deux teintes qui DISENT quelque chose : une disparition appelle une verification, une
 * arrivee est un fait nouveau. Un partenaire present des deux cotes ne porte aucune
 * pastille, parce que c'est le cas ordinaire et qu'une pastille « normal » ne dit rien.
 */
const PRESENCE: Record<string, { libelle: string; ton: 'warning' | 'success' }> = {
  A_SEULEMENT: { libelle: 'disparu', ton: 'warning' },
  B_SEULEMENT: { libelle: 'nouveau', ton: 'success' },
  LES_DEUX: { libelle: '', ton: 'success' },
};

export const COLONNES_COMPARAISON: readonly ColonneComparaison[] = [
  {
    cle: 'nom',
    libelle: 'Partenaire',
    rendu: (l) => {
      const presence = PRESENCE[l.presence] ?? PRESENCE.LES_DEUX;
      return (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-foreground">
            {l.nom?.trim() || `Établissement ${l.restaurantId.slice(0, 8)}`}
          </span>
          {presence.libelle && (
            <Chip color={presence.ton} size="sm" variant="soft">
              <Chip.Label>{presence.libelle}</Chip.Label>
            </Chip>
          )}
        </span>
      );
    },
  },
  {
    cle: 'rang',
    libelle: 'Rang',
    nombre: true,
    rendu: (l) => <MouvementRang a={l.a} b={l.b} ecarts={l.ecarts} />,
  },
  {
    cle: 'nbLivraisons',
    libelle: 'Livraisons',
    nombre: true,
    rendu: (l) => (
      <CelluleAB
        a={l.a?.nbLivraisons}
        b={l.b?.nbLivraisons}
        ecart={l.ecarts?.nbLivraisons ?? null}
        formateur={nombre}
        pct={l.ecarts?.nbLivraisonsPct ?? null}
      />
    ),
  },
  {
    cle: 'montantLivraison',
    libelle: 'Montant de livraison',
    nombre: true,
    rendu: (l) => (
      <CelluleAB
        a={l.a?.montantLivraison}
        b={l.b?.montantLivraison}
        ecart={l.ecarts?.montantLivraison ?? null}
        formateur={montant}
        pct={l.ecarts?.montantLivraisonPct ?? null}
      />
    ),
  },
  {
    cle: 'commission',
    libelle: 'Commission',
    nombre: true,
    /* Vide des qu'un des deux cotes n'est pas soumis a commission : le regime peut avoir
       change entre les deux periodes, et un zero se lirait comme une commission tombee. */
    rendu: (l) =>
      l.a?.soumisCommission === false && l.b?.soumisCommission === false ? (
        <span className="text-muted">{ABSENT}</span>
      ) : (
        <CelluleAB
          a={l.a?.commission}
          b={l.b?.commission}
          ecart={l.ecarts?.commission ?? null}
          formateur={montant}
          pct={l.ecarts?.commissionPct ?? null}
        />
      ),
  },
  {
    cle: 'totalARegler',
    libelle: 'Total à régler',
    nombre: true,
    rendu: (l) => (
      <CelluleAB
        a={l.a?.totalARegler}
        b={l.b?.totalARegler}
        ecart={l.ecarts?.totalARegler ?? null}
        formateur={montant}
        pct={l.ecarts?.totalAReglerPct ?? null}
      />
    ),
  },
] as const;

/**
 * L'ensemble des partenaires, indicateur par indicateur : ce qu'on regarde EN PREMIER
 * quand on compare deux periodes. Le detail par partenaire repond ensuite a « qui ».
 */
export interface IndicateurComparaison {
  cle: string;
  libelle: string;
  valeur: (totaux: ITotauxClassement) => string;
  ecart: (ecarts: IEcartIndicateurs) => string;
  pct: (ecarts: IEcartIndicateurs) => number | null;
  signe: (ecarts: IEcartIndicateurs) => number | null;
}

export const INDICATEURS_COMPARAISON: readonly IndicateurComparaison[] = [
  {
    cle: 'nbPartenairesClasses',
    ecart: () => ABSENT,
    libelle: 'Partenaires classés',
    pct: () => null,
    signe: () => null,
    valeur: (t) => nombre(t.nbPartenairesClasses),
  },
  {
    cle: 'nbLivraisons',
    ecart: (e) => valeurSignee(e.nbLivraisons, nombre),
    libelle: 'Livraisons',
    pct: (e) => e.nbLivraisonsPct,
    signe: (e) => e.nbLivraisons,
    valeur: (t) => nombre(t.nbLivraisons),
  },
  {
    cle: 'montantLivraison',
    ecart: (e) => valeurSignee(e.montantLivraison, montant),
    libelle: 'Montant de livraison',
    pct: (e) => e.montantLivraisonPct,
    signe: (e) => e.montantLivraison,
    valeur: (t) => montant(t.montantLivraison),
  },
  {
    cle: 'commission',
    ecart: (e) => valeurSignee(e.commission, montant),
    libelle: 'Commission',
    pct: (e) => e.commissionPct,
    signe: (e) => e.commission,
    valeur: (t) => montant(t.commission),
  },
  {
    cle: 'totalARegler',
    ecart: (e) => valeurSignee(e.totalARegler, montant),
    libelle: 'Total à régler',
    pct: (e) => e.totalAReglerPct,
    signe: (e) => e.totalARegler,
    valeur: (t) => montant(t.totalARegler),
  },
  {
    cle: 'valeurCommandes',
    ecart: (e) => valeurSignee(e.valeurCommandes, montant),
    libelle: 'Valeur des commandes',
    pct: (e) => e.valeurCommandesPct,
    signe: (e) => e.valeurCommandes,
    valeur: (t) => montant(t.valeurCommandes),
  },
] as const;
