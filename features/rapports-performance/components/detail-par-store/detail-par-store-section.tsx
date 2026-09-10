'use client';

import { Card, Table } from '@heroui-v3/react';

import { useDetailParStoreTable } from '@/features/rapports-performance/hooks/use-detail-par-store-table';
import type { IStorePerformance } from '@/features/rapports-performance/types/performance.type';

import {
  ANCRE_DETAIL_PAR_STORE,
  COLONNES_DETAIL_PAR_STORE,
  formatEntier,
  formatTaux,
} from './detail-par-store-table-columns';

interface DetailParStoreSectionProps {
  lignes: IStorePerformance[];
  /** Pourquoi la liste est vide, quand elle l'est. Groupe inconnu, ou groupe sans membre. */
  raisonVide?: string | null;
  /** Vrai pendant la PREMIERE lecture : des lignes de squelette, jamais « aucun store ». */
  enChargement?: boolean;
}

/**
 * Le DETAIL PAR STORE : une ligne par etablissement de la selection.
 *
 * <h3>Les trois questions</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : quel etablissement porte le cumul affiche en
 *       haut de page. Un consolide sans detail ne dit pas si quatre partenaires se
 *       partagent le chiffre ou si l'un d'eux fait tout - sur la production d'avril 2026,
 *       trois partenaires cumulent 8 869 livraisons dont 8 455 pour un seul.</li>
 *   <li><b>Ce qui appelle un geste</b> : le TRI, et lui seul. C'est un etat en lecture ;
 *       aucune ligne ne se modifie, aucun montant n'est donc peint. La couleur d'un
 *       nombre serait un acte gratuit ici.</li>
 *   <li><b>La forme naturelle</b> : un tableau. Sept indicateurs sur N etablissements se
 *       lisent en colonnes alignees, chasse tabulaire, montants a droite. En tuiles, deux
 *       etablissements ne se comparent pas. C'est le seul bloc de cet ecran ou le lecteur
 *       additionne de tete, d'ou la ligne de total, qui retombe sur les cartes de tete.</li>
 * </ul>
 *
 * <p>⚠ Ce bloc ne s'affiche QUE si `parStore` est non nul. En unitaire et en global le
 * serveur rend `null` : il n'y a rien a detailler, et un tableau vide se lirait
 * « aucun store », ce qui serait faux. Le tri de cette condition appartient a l'appelant.</p>
 */
export function DetailParStoreSection({
  enChargement = false,
  lignes,
  raisonVide,
}: DetailParStoreSectionProps) {
  const { lignes: visibles, totaux, tri, setTri } = useDetailParStoreTable(lignes);

  const valeurCellule = (ligne: IStorePerformance, colonne: (typeof COLONNES_DETAIL_PAR_STORE)[number]) => {
    if (colonne.id === 'nom') {
      // Le nom peut manquer quand l'identifiant ne correspond a aucun etablissement. La
      // ligne reste, avec ses chiffres : ils comptent dans les totaux de tete, les retirer
      // ferait un ecart inexplicable entre le tableau et les cartes.
      return (
        <span className="block max-w-[14rem] truncate" title={ligne.nom ?? ligne.restaurantId}>
          {ligne.nom ?? ligne.restaurantId}
        </span>
      );
    }

    if (colonne.id === 'successRate') {
      return <span className="block text-right tabular-nums">{formatTaux(ligne.successRate)}</span>;
    }

    return (
      <span className="block text-right tabular-nums">
        {formatEntier(ligne[colonne.id] as number)}
      </span>
    );
  };

  const valeurTotal = (colonne: (typeof COLONNES_DETAIL_PAR_STORE)[number]) => {
    if (colonne.id === 'nom') {
      return (
        <span className="block font-semibold">
          Total · {visibles.length} établissement{visibles.length > 1 ? 's' : ''}
        </span>
      );
    }

    // ⚠ RIEN sous la colonne du taux. Le taux de tete porte sur l'ensemble des courses,
    // pas sur la moyenne des lignes : y poser un nombre inventerait une grandeur.
    if (!colonne.totalisable) {
      return (
        <span className="block text-right text-muted" title="Le taux ne s'additionne pas">
          —
        </span>
      );
    }

    return (
      <span className="block text-right font-semibold tabular-nums">
        {formatEntier(totaux[colonne.id as keyof typeof totaux])}
      </span>
    );
  };

  return (
    <Card id={ANCRE_DETAIL_PAR_STORE}>
      <Card.Content className="gap-4 p-6">
        <h2 className="text-xl font-semibold text-foreground">Détail par store</h2>

        {/*
         * ⚠ `lg:` vaut 1024 px et la fenetre reelle du poste en fait environ 1000 : le
         * tableau ne s'ouvrirait JAMAIS et l'operateur ne verrait que les cartes du
         * telephone. Le seuil est `md:`.
         */}
        <div className="hidden md:block">
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Performance de chaque établissement de la sélection"
                className="min-w-[54rem]"
                onSortChange={setTri}
                sortDescriptor={tri}
              >
                <Table.Header>
                  {COLONNES_DETAIL_PAR_STORE.map((colonne) => (
                    <Table.Column
                      allowsSorting
                      className={colonne.classeLargeur}
                      id={colonne.id}
                      isRowHeader={colonne.id === 'nom'}
                      key={colonne.id}
                    >
                      {({ sortDirection }) => (
                        <Table.SortableColumnHeader sortDirection={sortDirection}>
                          {colonne.numerique ? (
                            <>
                              {/*
                               * L'intitule d'une colonne de nombres rejoint la DROITE, au-dessus
                               * de ses chiffres : un titre a gauche et des montants a droite ne
                               * se lisent pas comme une meme colonne.
                               *
                               * Il est pousse par un espaceur en `grow`, et non par une classe
                               * de justification : le composant porte deja `justify-between`,
                               * pose par la feuille de la bibliotheque, et la surcharger
                               * dependrait de l'ordre des regles dans la feuille finale - donc
                               * d'un detail de compilation, pas du code qu'on lit ici.
                               */}
                              <span aria-hidden="true" className="grow" />
                              <span className="text-right">{colonne.entete}</span>
                            </>
                          ) : (
                            colonne.entete
                          )}
                        </Table.SortableColumnHeader>
                      )}
                    </Table.Column>
                  ))}
                </Table.Header>

                <Table.Body
                  renderEmptyState={() => (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <p className="text-sm text-muted">
                        {raisonVide ?? 'Aucun établissement dans cette sélection.'}
                      </p>
                    </div>
                  )}
                >
                  {/*
                   * Pendant la lecture, des lignes de la MEME forme que les vraies : la
                   * hauteur ne saute pas quand la reponse arrive, et surtout le tableau
                   * n'affirme pas « aucun etablissement » sur une selection qu'il n'a pas
                   * encore lue.
                   */}
                  {enChargement
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {COLONNES_DETAIL_PAR_STORE.map((colonne) => (
                            <Table.Cell key={`sq-${i}-${colonne.id}`}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(enChargement ? [] : visibles).map((ligne) => (
                    <Table.Row id={ligne.restaurantId} key={ligne.restaurantId}>
                      {COLONNES_DETAIL_PAR_STORE.map((colonne) => (
                        <Table.Cell key={`${ligne.restaurantId}-${colonne.id}`}>
                          {valeurCellule(ligne, colonne)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}

                  {/*
                   * LA LIGNE DE TOTAL EST UNE LIGNE DU TABLEAU, pas un `Table.Footer`.
                   *
                   * `Table.Footer` est une barre rendue HORS du `<table>` : elle ne
                   * s'aligne sur aucune colonne. Or ce total existe pour une seule raison,
                   * retomber colonne par colonne sur les cartes de tete, et un total qui
                   * n'est pas sous sa colonne ne se verifie pas d'un coup d'oeil.
                   *
                   * ⚠ Autant de CELLULES que de COLONNES, ici comme ailleurs : une cellule
                   * de moins et React Aria leve « Cell count must match column count », ce
                   * qui emporte la page entiere en 500. Les cellules sont produites par la
                   * MEME liste que l'en-tete, l'ecart est donc impossible.
                   */}
                  {!enChargement && visibles.length > 0 ? (
                    <Table.Row id="total">
                      {COLONNES_DETAIL_PAR_STORE.map((colonne) => (
                        /*
                         * Le trait qui separe le total des lignes est pose sur les CELLULES,
                         * pas sur la ligne : la cellule peint deja son propre fond
                         * (`bg-surface`), donc une teinte posee sur le `<tr>` passerait
                         * dessous et ne se verrait jamais. Et seul `border-t-2`
                         * / `border-t-separator` est employe - la cellule declare son bord
                         * BAS, les deux reglages ne se disputent donc aucune propriete.
                         */
                        <Table.Cell className="border-t-2 border-t-separator" key={`total-${colonne.id}`}>
                          {valeurTotal(colonne)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ) : null}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>

        {/* ── Au telephone : une carte par etablissement, memes indicateurs ─────────── */}
        <div className="flex flex-col gap-3 md:hidden">
          {enChargement ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div className="h-36 animate-pulse rounded-xl bg-surface-secondary" key={`sqm-${i}`} />
            ))
          ) : visibles.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {raisonVide ?? 'Aucun établissement dans cette sélection.'}
            </p>
          ) : (
            <>
              {visibles.map((ligne) => (
                <Card key={ligne.restaurantId}>
                  <Card.Content className="gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {ligne.nom ?? ligne.restaurantId}
                    </span>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {COLONNES_DETAIL_PAR_STORE.filter((c) => c.id !== 'nom').map((colonne) => (
                        <div className="flex items-center justify-between gap-2" key={colonne.id}>
                          <dt className="truncate text-muted">{colonne.entete}</dt>
                          <dd className="shrink-0 font-medium tabular-nums text-foreground">
                            {colonne.id === 'successRate'
                              ? formatTaux(ligne.successRate)
                              : formatEntier(ligne[colonne.id] as number)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </Card.Content>
                </Card>
              ))}

              {/*
                * Le total existe aussi au telephone : c'est lui qu'on compare aux cartes de
                * tete. Il se distingue par son intitule et sa graisse, sans cadre ajoute -
                * une bordure ou un fond poses ici se disputeraient ceux que la carte declare
                * deja, et le resultat dependrait de l'ordre des regles dans la feuille.
                */}
              <Card>
                <Card.Content className="gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    Total · {visibles.length} établissement{visibles.length > 1 ? 's' : ''}
                  </span>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {COLONNES_DETAIL_PAR_STORE.filter((c) => c.id !== 'nom' && c.totalisable).map(
                      (colonne) => (
                        <div className="flex items-center justify-between gap-2" key={colonne.id}>
                          <dt className="truncate text-muted">{colonne.entete}</dt>
                          <dd className="shrink-0 font-semibold tabular-nums text-foreground">
                            {formatEntier(totaux[colonne.id as keyof typeof totaux])}
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </Card.Content>
              </Card>
            </>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
