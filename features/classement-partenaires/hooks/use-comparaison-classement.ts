'use client';

import { format, startOfMonth, subMonths } from 'date-fns';
import React from 'react';

import { useComparaisonQuery } from '@/features/classement-partenaires/queries/classement.query';
import type { SensTri, TriClassement } from '@/features/classement-partenaires/types/classement.types';
import { libelleMois } from '@/features/classement-partenaires/utils/classement-format.utils';

/**
 * Le choix des deux periodes a comparer, et leur lecture.
 *
 * <h3>Pourquoi seulement des MOIS</h3>
 * <p>La comparaison accepte aussi deux plages libres, et l'ecran ne les propose pas. Deux
 * plages de durees differentes produisent des ecarts qui ne veulent rien dire (« +40 %
 * » entre huit jours et trente et un), et rien a l'ecran ne pourrait empecher de les
 * choisir. Le mois calendaire est la granularite de l'historique : c'est aussi celle qui
 * rend deux periodes comparables.</p>
 *
 * <h3>L'ordre n'est pas cosmetique</h3>
 * <p>`A` est la reference et `B` la periode comparee ; les ecarts valent `B moins A`.
 * Intervertir les deux inverse le signe de chaque nombre de l'ecran. On refuse donc de
 * lire tant que A ne precede pas B, plutot que d'intervertir en silence.</p>
 */
export function useComparaisonClassement({
  moisAffiche,
  sens,
  tri,
}: {
  /** Le mois du classement affiche, quand la periode en est un. Sert de proposition. */
  moisAffiche: string | null;
  sens: SensTri;
  tri: TriClassement;
}) {
  /*
   * Vingt-quatre mois CLOS. Le mois en cours est exclu : il se comparerait a des mois
   * entiers avec ses seuls jours ecoules, et la baisse serait un artefact de calendrier.
   */
  const moisDisponibles = React.useMemo(() => {
    const dernierClos = subMonths(startOfMonth(new Date()), 1);
    return Array.from({ length: 24 }, (_, i) => {
      const date = subMonths(dernierClos, i);
      const cle = format(date, 'yyyy-MM');
      return { cle, libelle: libelleMois(cle) };
    });
  }, []);

  /*
   * La proposition d'ouverture : le mois affiche par le classement, compare au mois qui le
   * precede. C'est la comparaison qu'on fait neuf fois sur dix, et elle evite d'arriver sur
   * deux champs vides.
   *
   * Elle ne vaut QU'A L'OUVERTURE. Changer ensuite la periode du classement ne rejoue pas
   * ces deux champs : la comparaison porte ses propres periodes, c'est tout son objet, et
   * les faire suivre le classement les remettrait a zero au milieu d'une lecture.
   */
  const defautB =
    moisAffiche && moisDisponibles.some((m) => m.cle === moisAffiche)
      ? moisAffiche
      : (moisDisponibles[0]?.cle ?? '');
  const defautA = defautB ? format(subMonths(new Date(`${defautB}-01T00:00:00`), 1), 'yyyy-MM') : '';

  const [moisA, setMoisA] = React.useState(defautA);
  const [moisB, setMoisB] = React.useState(defautB);

  const ordreValide = Boolean(moisA && moisB) && moisA < moisB;
  const query = useComparaisonQuery(ordreValide ? moisA : '', ordreValide ? moisB : '', tri, sens);

  return {
    comparaison: query.data,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    moisA,
    moisB,
    moisDisponibles,
    ordreValide,
    refetch: query.refetch,
    setMoisA,
    setMoisB,
  };
}
