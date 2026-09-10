'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';
import type { IEvolutionMois } from '@/features/classement-partenaires/types/classement.types';
import {
  ABSENT,
  libelleMois,
  montant,
  nombre,
  pourcentageSigne,
  taux,
} from '@/features/classement-partenaires/utils/classement-format.utils';

/**
 * Les colonnes de la FRISE d'un partenaire, un mois par ligne.
 *
 * <h3>Pourquoi une frise et pas une courbe</h3>
 * <p>La question posee a cet ecran est « combien, et a quel rang », pas « quelle allure ».
 * Un graphique repond bien a la seconde et mal a la premiere : il faut survoler chaque
 * point pour lire un montant. Les mois sont donc des lignes et les indicateurs des
 * colonnes, ce qui permet en plus de lire une variation VERTICALEMENT, en comparant deux
 * lignes voisines.</p>
 *
 * <h3>La seule variation ecrite</h3>
 * <p>Deux valeurs seulement ne se lisent pas verticalement : le mouvement de RANG, qui
 * demanderait une soustraction, et la variation du total en pourcentage, qui demanderait
 * une division. Elles sont donc calculees par le serveur et affichees. Tout le reste se
 * compare a l'oeil, ligne a ligne, et n'a pas besoin d'une colonne de plus.</p>
 *
 * <p>⚠ L'ecart porte sur le mois precedent DE LA SERIE, pas sur le mois calendaire
 * precedent : un mois jamais capture est absent de la frise, et la comparaison saute
 * par-dessus lui. Les mois manquants sont listes sous le tableau.</p>
 */
export interface ColonneEvolution {
  cle: string;
  libelle: string;
  nombre?: boolean;
  rendu: (mois: IEvolutionMois) => React.ReactNode;
}

/** Le mouvement de rang d'un mois sur l'autre. Fleche ET chiffre, jamais la couleur seule. */
function MouvementRang({ mois }: { mois: IEvolutionMois }) {
  const ecart = mois.ecart;
  if (!ecart || ecart.rang === null) return <span className="text-muted">{ABSENT}</span>;

  const stable = ecart.rang === 0;
  const hausse = ecart.rang > 0;
  const Fleche = stable ? Minus : hausse ? ArrowUp : ArrowDown;
  const ton = stable
    ? 'text-muted'
    : hausse
      ? 'text-green-800 dark:text-green-400'
      : 'text-red-800 dark:text-red-400';

  return (
    <span className={cn('inline-flex items-center justify-end gap-1 tabular-nums', ton)}>
      <Fleche aria-hidden="true" className="size-3.5 shrink-0" />
      {stable
        ? 'stable'
        : `${hausse ? '+' : ''}${ecart.rang} place${Math.abs(ecart.rang) > 1 ? 's' : ''}`}
    </span>
  );
}

export const COLONNES_EVOLUTION: readonly ColonneEvolution[] = [
  {
    cle: 'mois',
    libelle: 'Mois',
    rendu: (m) => <span className="font-medium capitalize text-foreground">{libelleMois(m.mois)}</span>,
  },
  {
    cle: 'rang',
    libelle: 'Rang',
    nombre: true,
    /* « 5e sur 12 » et « 5e sur 69 » ne disent pas la meme chose : la taille du classement
       fait partie du rang, elle n'est pas un detail de contexte. */
    rendu: (m) => (
      <span>
        <span className="font-bold text-foreground">{m.rang}</span>
        <span className="text-xs text-muted"> / {m.nbPartenairesClasses}</span>
      </span>
    ),
  },
  {
    cle: 'mouvement',
    libelle: 'Mouvement',
    nombre: true,
    rendu: (m) => <MouvementRang mois={m} />,
  },
  { cle: 'nbLivraisons', libelle: 'Livraisons', nombre: true, rendu: (m) => nombre(m.nbLivraisons) },
  {
    cle: 'montantLivraison',
    libelle: 'Montant de livraison',
    nombre: true,
    rendu: (m) => montant(m.montantLivraison),
  },
  {
    cle: 'commission',
    libelle: 'Commission',
    nombre: true,
    rendu: (m) =>
      m.soumisCommission ? montant(m.commission) : <span className="text-muted">{ABSENT}</span>,
  },
  {
    cle: 'totalARegler',
    libelle: 'Total à régler',
    nombre: true,
    rendu: (m) => (
      <span className="block">
        <span className="font-semibold text-foreground">{montant(m.totalARegler)}</span>
        {m.ecart && m.ecart.totalAReglerPct !== null && (
          <span className="block text-[11px] text-muted">
            {pourcentageSigne(m.ecart.totalAReglerPct)}
          </span>
        )}
      </span>
    ),
  },
  {
    cle: 'tauxSucces',
    libelle: 'Taux de succès',
    nombre: true,
    rendu: (m) => (m.tauxSucces === null ? <span className="text-muted">{ABSENT}</span> : taux(m.tauxSucces)),
  },
] as const;
