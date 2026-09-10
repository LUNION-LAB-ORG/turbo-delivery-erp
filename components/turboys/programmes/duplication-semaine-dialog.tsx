'use client';

import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';

/**
 * Dupliquer une semaine entière vers une autre.
 *
 * <p>La direction l'a demandé en recette : la majorité des livreurs gardent le même site
 * et le même carburant d'une semaine à l'autre, et resaisir quarante programmes chaque
 * lundi n'a pas de sens. La copie porte le planning des Opérations, jours de repos
 * compris ; chaque ligne se retouche ensuite séparément.</p>
 *
 * <p>La règle validée : la duplication N'ÉCRASE RIEN. Une semaine qui porte déjà un
 * programme la refuse, et l'écran le dit avant le clic plutôt que de laisser le serveur
 * répondre par une erreur.</p>
 */
export function DuplicationSemaineDialog({
  enAttente = false,
  nbDejaLa,
  onDupliquer,
  onFermer,
  ouvert,
  semaineCible,
  semaineSource,
}: {
  enAttente?: boolean;
  /** Programmes déjà présents sur la semaine cible. Au-delà de zéro, la duplication est refusée. */
  nbDejaLa: number;
  onDupliquer: () => void;
  onFermer: () => void;
  ouvert: boolean;
  semaineCible: { annee: number; semaine: number };
  semaineSource: { annee: number; semaine: number };
}) {
  return (
    <FenetreAction
      actionInactive={nbDejaLa > 0}
      enAttente={enAttente}
      libelleAction={`Dupliquer vers la semaine ${semaineCible.semaine}`}
      onAction={onDupliquer}
      onFermer={onFermer}
      ouvert={ouvert}
      titre={`Dupliquer la semaine ${semaineSource.semaine} / ${semaineSource.annee}`}
    >
      {nbDejaLa > 0 ? (
        <p className="text-sm text-foreground">
          La semaine {semaineCible.semaine} porte déjà {nbDejaLa} programme{nbDejaLa > 1 ? 's' : ''}. La duplication
          n’écrase rien : supprimez-les, ou modifiez-les ligne par ligne.
        </p>
      ) : (
        <>
          <p className="text-sm text-foreground">
            Tous les programmes de la semaine {semaineSource.semaine} sont recopiés sur la semaine{' '}
            {semaineCible.semaine}, en brouillon : jours travaillés et de repos, horaires, postes, carburant par jour,
            site de la semaine.
          </p>
          <p className="text-sm text-muted">
            Rien n’est publié. Chaque ligne se modifie ensuite séparément, et le jour de repos se déplace si le
            roulement change. Ce qui n’est pas copié : le statut, les acceptations, le pointage, le total figé.
          </p>
        </>
      )}
    </FenetreAction>
  );
}
