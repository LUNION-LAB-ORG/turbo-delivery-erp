'use client';

import React from 'react';

import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import progresseBarePerformance from '@/components/dashboard/delivery-men/performance-creneau/progression-bare-performance';
import { Progression } from '@/types/performance-creneauId';
import { formatMontant } from '@/utils/format.utils';

/**
 * La progression d'un livreur, jour par jour.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>Quatre fichiers portaient le même tableau, avec la même fonction
 * `renderCell(data, columnKey)` à `switch`, les mêmes trois colonnes, et le même montage
 * « tableau sur poste, cartes sur téléphone » recopié en dessous. Les quatre s'annonçaient
 * aux lecteurs d'écran sous le nom « Example table with custom cells » — la légende de
 * l'exemple de la documentation HeroUI.</p>
 *
 * <p>Deux d'entre eux rendaient leurs lignes CLIQUABLES : un `onClick` posait
 * `setOpen(true)`, mais rien ne lisait `open` — la fenêtre de détail était importée sans
 * jamais être rendue. Le curseur changeait, le clic ne faisait rien. Le mode `aVenir`
 * remplace ce faux-semblant : quand il n'y a pas de détail à ouvrir, la ligne ne prétend
 * pas être cliquable.</p>
 *
 * <p>Les libellés de colonnes disaient « commission du Jour » et l'état vide « Aucun
 * Livreur » — avec deux espaces — sur un tableau de JOURS.</p>
 */
export function TableauProgression({
  aVenir,
  jours,
  onJour,
}: {
  /** Le créneau n'a pas encore eu lieu : la progression et la commission ne sont pas connues. */
  aVenir?: boolean;
  jours: readonly Progression[];
  /** Ouvrir le détail d'un jour. Absent : les lignes ne sont pas cliquables. */
  onJour?: (jour: Progression) => void;
}) {
  const colonnes: ColonneResponsive<Progression>[] = [
    {
      cle: 'jour',
      identite: true,
      libelle: 'Jour',
      rendu: (j) => (
        <span className={`text-sm font-medium ${aVenir ? 'text-muted' : 'text-foreground'}`}>
          {j.jour || 'Non défini'}
        </span>
      ),
    },
    {
      cle: 'progression',
      libelle: 'Progression du jour',
      rendu: (j) =>
        aVenir ? (
          <span className="text-sm text-muted">À venir</span>
        ) : (
          <div className="flex items-center gap-2">
            {progresseBarePerformance(j)}
            <span className="text-sm text-muted">{j.heure} h de travail</span>
          </div>
        ),
    },
    {
      cle: 'commission',
      libelle: 'Commission du jour',
      nombre: true,
      rendu: (j) =>
        aVenir ? (
          <span className="text-sm text-muted">—</span>
        ) : (
          <span className="text-sm text-foreground">{formatMontant(j.commission)}</span>
        ),
    },
    ...(onJour
      ? [
          {
            actions: true,
            cle: 'actions',
            libelle: 'Détail',
            rendu: (j: Progression) => (
              <button
                className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                onClick={() => onJour(j)}
                type="button"
              >
                Voir le détail
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <TableauResponsive
      cleLigne={(j) => j.jour ?? ''}
      colonnes={colonnes}
      libelle="Progression par jour"
      lignes={jours}
      vide={aVenir ? 'Créneau à venir' : 'Aucun jour sur ce créneau'}
    />
  );
}
