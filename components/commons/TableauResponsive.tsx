'use client';

import { Card, Table } from '@heroui-v3/react';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';

export interface ColonneResponsive<T> {
  /** Identifiant technique de la colonne. */
  cle: string;
  /** En-tête de colonne, et libellé de la ligne sur une carte tactile. */
  libelle: string;
  /** Le contenu de la cellule. */
  rendu: (ligne: T) => React.ReactNode;
  /**
   * Cette colonne est l'IDENTITÉ de la ligne : nom, matricule, code. Sur mobile elle
   * titre la carte au lieu d'être une ligne « libellé / valeur » parmi les autres.
   */
  identite?: boolean;
  /** Cette colonne porte les gestes : en pied de carte sur mobile, pleine largeur. */
  actions?: boolean;
  /** Un chiffre : chasse tabulaire et alignement à droite. */
  nombre?: boolean;
}

/**
 * Un tableau sur un poste de travail, des cartes tactiles sur un téléphone.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>Cinq écrans de l'ERP — coursiers assignés, birds, demandes d'identification, tarifs,
 * et leurs voisins — portaient chacun leur copie du même montage : une fonction
 * `renderCell(item: any, columnKey: string)` avec un `switch`, appelée une fois par le
 * tableau et une seconde fois, cellule par cellule, par la liste de cartes en dessous. Le
 * `switch` typait tout en `any`, et les deux rendus divergeaient dès qu'on touchait à l'un
 * sans penser à l'autre — c'est ainsi qu'un écran affichait le statut sur mobile et pas
 * sur poste.</p>
 *
 * <p>Ici les colonnes sont déclarées UNE fois, typées sur la ligne, et le composant décide
 * de la forme selon la largeur. Ajouter une colonne l'ajoute aux deux rendus.</p>
 *
 * <h3>Les trois états</h3>
 * <p>Un échec de lecture ne doit jamais se lire comme une liste vide : `erreur` remplace
 * le contenu au lieu de le laisser afficher « aucun résultat ». C'est le défaut le plus
 * répandu de ce projet, et il faisait conclure aux opérateurs qu'ils n'avaient rien à
 * traiter.</p>
 */
export function TableauResponsive<T>({
  colonnes,
  cleLigne,
  enChargement,
  enCoursDeRelance,
  erreur,
  libelle,
  lignes,
  onReessayer,
  quoi,
  vide,
}: {
  cleLigne: (ligne: T) => string;
  colonnes: readonly ColonneResponsive<T>[];
  enChargement?: boolean;
  /** Une relance est en cours : l'état d'erreur le montre. */
  enCoursDeRelance?: boolean;
  erreur?: boolean;
  /** Nom accessible du tableau. */
  libelle: string;
  lignes: readonly T[];
  onReessayer?: () => void;
  /** Ce qu'on n'a pas pu lire, pour la phrase d'erreur : « les livreurs assignés ». */
  quoi?: string;
  /** Le message quand il n'y a réellement rien. */
  vide: string;
}) {
  if (erreur) {
    return (
      <EtatErreur enCours={enCoursDeRelance} onReessayer={onReessayer} quoi={quoi ?? libelle} />
    );
  }

  const identite = colonnes.find((c) => c.identite) ?? colonnes[0];
  const gestes = colonnes.find((c) => c.actions);
  const details = colonnes.filter((c) => c !== identite && c !== gestes);

  return (
    <>
      {/* Tableau — poste de travail (≥ md) */}
      <div className="hidden md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label={libelle}>
              <Table.Header>
                {colonnes.map((c, i) => (
                  <Table.Column
                    className={c.nombre ? 'text-right' : undefined}
                    id={c.cle}
                    isRowHeader={i === 0}
                    key={c.cle}
                  >
                    {c.libelle}
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  enChargement ? null : (
                    <p className="py-8 text-center text-sm text-muted">{vide}</p>
                  )
                }
              >
                {enChargement
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {colonnes.map((c) => (
                          <Table.Cell key={c.cle}>
                            <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))
                  : lignes.map((ligne) => (
                      <Table.Row id={cleLigne(ligne)} key={cleLigne(ligne)}>
                        {colonnes.map((c) => (
                          <Table.Cell
                            className={c.nombre ? 'text-right tabular-nums' : undefined}
                            key={c.cle}
                          >
                            {c.rendu(ligne)}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      {/* Cartes tactiles — téléphone (< md) */}
      <div className="flex flex-col gap-3 md:hidden">
        {enChargement ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="h-36 animate-pulse rounded-xl bg-surface-secondary" key={i} />
          ))
        ) : lignes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{vide}</p>
        ) : (
          lignes.map((ligne) => (
            <Card key={cleLigne(ligne)}>
              <Card.Content className="gap-2 p-4">
                <div className="min-w-0">{identite.rendu(ligne)}</div>
                {details.map((c) => (
                  <div className="flex items-center justify-between gap-3" key={c.cle}>
                    <span className="shrink-0 text-xs text-muted">{c.libelle}</span>
                    <span
                      className={`min-w-0 text-right text-sm text-foreground ${
                        c.nombre ? 'tabular-nums' : ''
                      }`}
                    >
                      {c.rendu(ligne)}
                    </span>
                  </div>
                ))}
                {gestes && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">{gestes.rendu(ligne)}</div>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
