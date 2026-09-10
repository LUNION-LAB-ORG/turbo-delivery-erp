'use client';

import { Button, Card, Table } from '@heroui-v3/react';
import { LineChart } from 'lucide-react';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { cn } from '@/lib/utils';
import type { ColonneClassement } from '@/features/classement-partenaires/components/classement-table-columns';
import { COLONNES_CLASSEMENT } from '@/features/classement-partenaires/components/classement-table-columns';
import type {
  ILigneClassement,
  ITotauxClassement,
} from '@/features/classement-partenaires/types/classement.types';
import { ABSENT, libelleRang } from '@/features/classement-partenaires/utils/classement-format.utils';

import type { SortDescriptor } from '@heroui-v3/react';

/**
 * LE CLASSEMENT, du 1er au dernier.
 *
 * <h3>La forme naturelle de cette donnee</h3>
 * <p>Un classement chiffre se lit en COLONNES ALIGNEES : c'est le seul moyen de voir d'un
 * coup d'oeil que le troisieme facture plus que le deuxieme. Chaque nombre est en chasse
 * tabulaire et cale a droite, les unites tombent sous les unites. Des tuiles rendraient la
 * meme donnee incomparable.</p>
 *
 * <h3>Le pied de tableau est une LIGNE, pas une barre</h3>
 * <p>`Table.Footer` existe et il est utilise plus bas, mais la bibliotheque le rend HORS
 * du tableau : il ne s'aligne sur aucune colonne. Or un total de colonne qui ne tombe pas
 * sous sa colonne ne se verifie pas. Les totaux sont donc une derniere LIGNE, alignee,
 * et la barre du dessous ne porte que ce qui ne rentre dans aucune colonne : pourquoi le
 * total des commissions peut depasser la somme des cellules visibles, et pourquoi le taux
 * de succes n'a pas de total.</p>
 *
 * <h3>La regle qui casse l'ecran</h3>
 * <p>En-tete, lignes de donnees, ligne de totaux et lignes de squelette sont TOUS produits
 * par un `map` sur `colonnesEcran`. React Aria leve « Cell count must match column count »
 * et emporte la page en 500 des qu'un seul rendu compte autrement ; ici l'ecart n'est pas
 * ecrivable.</p>
 */
interface ClassementTableProps {
  lignes: readonly ILigneClassement[];
  totaux?: ITotauxClassement;
  descripteurTri: SortDescriptor;
  onTri: (descripteur: SortDescriptor) => void;
  /** Ouvre la fiche d'evolution d'un partenaire. */
  onFiche: (ligne: ILigneClassement) => void;
  isLoading?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  onReessayer?: () => void;
  /** Le libelle de la periode, pour le nom accessible du tableau. */
  libellePeriode: string;
}

export function ClassementTable({
  descripteurTri,
  isError = false,
  isFetching = false,
  isLoading = false,
  libellePeriode,
  lignes,
  onFiche,
  onReessayer,
  onTri,
  totaux,
}: ClassementTableProps) {
  /*
   * La colonne de GESTE s'ajoute aux colonnes de DONNEES, elle ne les remplace pas : les
   * exports reprennent `COLONNES_CLASSEMENT` telle quelle et gardent donc exactement la
   * structure de l'ecran, sans le bouton qui n'a aucun sens dans un fichier.
   */
  const colonnesEcran: ColonneClassement[] = React.useMemo(
    () => [
      ...COLONNES_CLASSEMENT,
      {
        brut: () => null,
        cle: 'fiche',
        largeur: 'w-[3.5rem]',
        libelle: '',
        partPdf: 0,
        rendu: (ligne) => (
          <Button
            aria-label={`Évolution de ${ligne.nom ?? 'ce partenaire'}`}
            isIconOnly
            onPress={() => onFiche(ligne)}
            size="sm"
            variant="ghost"
          >
            <LineChart aria-hidden="true" className="size-4" />
          </Button>
        ),
        texte: () => '',
        total: () => null,
        totalBrut: () => null,
        totalTexte: () => '',
        tri: null,
      },
    ],
    [onFiche],
  );

  if (isError) {
    return (
      <EtatErreur enCours={isFetching} onReessayer={onReessayer} quoi="le classement des partenaires" />
    );
  }

  const vide = !isLoading && lignes.length === 0;

  return (
    <>
      {/* ── Poste de travail (>= md). Le seuil `lg` ne s'ouvre jamais sur 1000 px. ── */}
      <Card className="hidden md:block">
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label={`Classement des partenaires, ${libellePeriode}`}
                className="min-w-[62rem]"
                onSortChange={onTri}
                sortDescriptor={descripteurTri}
              >
                <Table.Header>
                  {colonnesEcran.map((c, i) => (
                    <Table.Column
                      allowsSorting={c.tri !== null}
                      className={cn(c.largeur, c.nombre && 'text-right')}
                      id={c.cle}
                      isRowHeader={i === 0}
                      key={c.cle}
                    >
                      {c.tri !== null
                        ? ({ sortDirection }: { sortDirection?: 'ascending' | 'descending' }) => (
                            /*
                             * `justify-end` sur les colonnes de nombres : la feuille de
                             * style de la bibliotheque pose `justify-between` sur cet
                             * element, ce qui collerait le libelle a gauche et le chevron
                             * a droite, loin des chiffres qu'il ordonne.
                             */
                            <Table.SortableColumnHeader
                              className={cn('gap-1', c.nombre && 'justify-end')}
                              sortDirection={sortDirection}
                            >
                              {c.libelle}
                            </Table.SortableColumnHeader>
                          )
                        : c.libelle}
                    </Table.Column>
                  ))}
                </Table.Header>

                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : (
                      <p className="py-10 text-center text-sm text-muted">
                        Aucun partenaire n&apos;a de course sur cette période.
                      </p>
                    )
                  }
                >
                  {/* Un squelette de la MEME forme : la hauteur ne saute pas a l'arrivee. */}
                  {isLoading
                    ? Array.from({ length: 8 }).map((_, i) => (
                        <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                          {colonnesEcran.map((c) => (
                            <Table.Cell key={c.cle}>
                              <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading ? [] : lignes).map((ligne) => (
                    <Table.Row id={ligne.restaurantId} key={ligne.restaurantId}>
                      {colonnesEcran.map((c) => (
                        <Table.Cell
                          className={cn(c.nombre && 'text-right tabular-nums')}
                          key={c.cle}
                        >
                          {c.rendu(ligne)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}

                  {/* La ligne de totaux, ALIGNEE sous ses colonnes. Voir le bloc de tete. */}
                  {!isLoading && totaux && lignes.length > 0 ? (
                    <Table.Row id="totaux" key="totaux">
                      {colonnesEcran.map((c) => (
                        <Table.Cell
                          className={cn(
                            'border-t border-separator bg-surface-secondary font-semibold',
                            c.nombre && 'text-right tabular-nums',
                          )}
                          key={c.cle}
                        >
                          {c.total(totaux)}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ) : null}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>

            {/*
             * Frere de `Table.ScrollContainer`, hors de `Table.Content` : place a
             * l'interieur, la bibliotheque ne le rend pas du tout.
             */}
            {!isLoading && totaux && lignes.length > 0 && (
              <Table.Footer className="flex-col items-start gap-1 text-xs text-muted">
                <span>
                  Le total des commissions porte sur les {totaux.nbPartenairesClasses} partenaires,
                  y compris ceux dont la cellule reste vide faute de régime de commission. Il peut
                  donc dépasser la somme des montants affichés.
                </span>
                <span>
                  Le taux de succès n&apos;a pas de total ({ABSENT}) : un taux d&apos;ensemble se
                  calcule sur les courses cumulées, jamais sur la moyenne des taux de chaque ligne.
                </span>
              </Table.Footer>
            )}
          </Table>
        </Card.Content>
      </Card>

      {/* ── Téléphone (< md) : une carte par partenaire, mêmes valeurs, même ordre. ── */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" key={`sqm-${i}`} />
          ))
        ) : vide ? (
          <p className="py-10 text-center text-sm text-muted">
            Aucun partenaire n&apos;a de course sur cette période.
          </p>
        ) : (
          lignes.map((ligne) => (
            <Card key={ligne.restaurantId}>
              <Card.Content className="gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                      {libelleRang(ligne.rang)}
                    </span>
                    <span className="min-w-0">{COLONNES_CLASSEMENT[1].rendu(ligne)}</span>
                  </span>
                  <Button
                    aria-label={`Évolution de ${ligne.nom ?? 'ce partenaire'}`}
                    isIconOnly
                    onPress={() => onFiche(ligne)}
                    size="sm"
                    variant="ghost"
                  >
                    <LineChart aria-hidden="true" className="size-4" />
                  </Button>
                </div>

                <dl className="flex flex-col gap-1 text-sm">
                  {COLONNES_CLASSEMENT.filter((c) => c.cle !== 'rang' && c.cle !== 'nom').map((c) => (
                    <div className="flex items-center justify-between gap-3" key={c.cle}>
                      <dt className="text-xs text-muted">{c.libelle}</dt>
                      <dd className="text-right tabular-nums text-foreground">{c.rendu(ligne)}</dd>
                    </div>
                  ))}
                </dl>
              </Card.Content>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
