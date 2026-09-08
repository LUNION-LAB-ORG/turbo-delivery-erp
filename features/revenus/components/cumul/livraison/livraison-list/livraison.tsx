'use client';

import { Card, Label, SearchField, Table } from '@heroui-v3/react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { RevenusFilters } from '@/features/revenus/components/filtres/revenus';
import { useLivraisonList } from '@/features/revenus/hooks/use-livraison-list';
import { ILivraison } from '@/features/revenus/types/livraison.types';
import { formatMontant } from '@/utils/format.utils';

import {
  ActionsLivraison,
  COLONNES_NOMBRE,
  formatDateHeure,
  livraisonColumns,
} from './livraison-table-columns';
import { Pagination } from './pagination';

/**
 * La liste des livraisons facturees.
 *
 * <h3>Ce qui change</h3>
 * <p>Le tableau etait un `&lt;table&gt;` brut coiffe d'un bandeau ROUGE DE MARQUE, avec des
 * EMOJIS en guise d'indicateurs de tri. Il est monte sur le `Table` de la v3, comme les
 * autres tableaux de l'ERP, et le tri se lit a l'etat de l'en-tete.</p>
 *
 * <h3>Trois defauts de fond, corriges</h3>
 * <p>Le tableau du poste affichait la PAGE COURANTE, les cartes du telephone affichaient
 * la liste ENTIERE : le meme ecran ne montrait pas la meme chose selon la largeur, et la
 * pagination n'avait aucun effet sur mobile. Les deux rendus partent desormais des memes
 * lignes.</p>
 *
 * <p>La recherche et le tri s'appliquaient a la page DEJA DECOUPEE : chercher une
 * reference qui n'etait pas sur la page affichee ne rendait rien, et trier ne reordonnait
 * que dix lignes sur deux cents. On cherche et on trie sur l'ensemble, on decoupe ensuite.
 * Le compteur, lui, annonce le nombre de lignes RETENUES : il ignorait la recherche et
 * affichait le total.</p>
 *
 * <p>Un echec de lecture s'ecrivait « Erreur lors du chargement » en rouge, sans moyen de
 * relancer ; `EtatErreur` est la forme commune du projet. Le chargement remplacait la
 * carte entiere par une phrase : ce sont des lignes en attente, la page ne saute plus.</p>
 */
export default function LivraisonList() {
  const { error, filters, isError, isLoading, livraisons } = useLivraisonList();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [recherche, setRecherche] = useState('');
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);

  const livraisonsArray: ILivraison[] = Array.isArray(livraisons) ? livraisons : [];

  const handleRestaurantChange = (restaurantIds: string[]) => {
    setSelectedRestaurants(restaurantIds);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedRestaurants([]);
    setCurrentPage(1);
  };

  const filteredLivraisons = useMemo(() => {
    if (!livraisonsArray.length) return [];

    const terme = recherche.trim().toLowerCase();

    return livraisonsArray.filter((livraisonItem) => {
      // Filtre par restaurants (multi-selection)
      if (selectedRestaurants.length > 0 && livraisonItem.nomRestaurant) {
        if (!selectedRestaurants.includes(livraisonItem.nomRestaurant)) return false;
      }

      // Filtre par nom de livreur
      if (
        filters.nomLivreur &&
        livraisonItem.nomLivreur &&
        !livraisonItem.nomLivreur.toLowerCase().includes(filters.nomLivreur.toLowerCase())
      )
        return false;

      // Filtre par date exacte (creation)
      if (
        filters.createdAt &&
        livraisonItem.createdAt &&
        !livraisonItem.createdAt.includes(filters.createdAt)
      )
        return false;

      // Filtre par frais de livraison
      if (filters.fraisLivraison && livraisonItem.fraisLivraison !== filters.fraisLivraison)
        return false;

      // Filtre par date de debut
      if (filters.dateLivraison && livraisonItem.createdAt) {
        const livraisonDate = new Date(livraisonItem.createdAt);
        const dateLivraison = new Date(filters.dateLivraison);
        if (livraisonDate < dateLivraison) return false;
      }

      /*
       * La recherche porte sur ce qu'on LIT dans le tableau. Elle etait confiee au filtre
       * global de TanStack, pose sur les seules lignes de la page courante : une reference
       * absente de la page affichee restait introuvable.
       */
      if (terme) {
        const champs = [
          String(livraisonItem.refCommande ?? ''),
          livraisonItem.nomLivreur ?? '',
          livraisonItem.nomRestaurant ?? '',
          formatDateHeure(livraisonItem.createdAt),
        ];
        if (!champs.some((c) => c.toLowerCase().includes(terme))) return false;
      }

      return true;
    });
  }, [livraisonsArray, filters, selectedRestaurants, recherche]);

  const table = useReactTable({
    columns: livraisonColumns,
    data: filteredLivraisons,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  // Le tri s'applique a l'ensemble retenu ; le decoupage vient APRES lui.
  const lignesTriees = table.getRowModel().rows;
  const nbPages = Math.max(1, Math.ceil(lignesTriees.length / itemsPerPage));
  // La page est bornee : un filtre qui reduit la liste laissait sinon l'operateur sur une
  // page 7 devenue vide, sans rien lui dire.
  const pageCourante = Math.min(currentPage, nbPages);
  const debut = (pageCourante - 1) * itemsPerPage;
  const lignes = lignesTriees.slice(debut, debut + itemsPerPage);

  /*
   * Les en-tetes portent `allowsSorting`, donc `Table.Content` doit recevoir
   * `sortDescriptor` ET `onSortChange` : sans eux la fleche s'affiche, se survole, et le
   * tableau ne se trie jamais.
   */
  const triCourant = sorting[0];

  return (
    <Card className="my-6">
      <Card.Header className="flex-row flex-wrap items-center justify-between gap-3">
        {/* Les filtres etaient rendus DANS le titre : un `<h3>` contenant des boutons et
            deux listes deroulantes. Ils sont a cote de lui. */}
        <Card.Title>Liste des livraisons</Card.Title>
        <RevenusFilters
          onClearFilters={handleClearFilters}
          onRestaurantChange={handleRestaurantChange}
          selectedRestaurants={selectedRestaurants}
        />
      </Card.Header>

      <Card.Content className="p-0">
        {isError ? (
          <EtatErreur
            detail={error instanceof Error ? error.message : undefined}
            quoi="les livraisons"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3 px-4 pb-4">
              {/* Un champ de recherche sans LIBELLE : le seul indice de ce qu'on y
                  cherchait etait un « Rechercher... » qui disparait des la premiere lettre. */}
              <SearchField
                className="max-w-sm"
                onChange={(v) => {
                  setRecherche(v);
                  setCurrentPage(1);
                }}
                value={recherche}
              >
                <Label>Rechercher</Label>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Référence, livreur, restaurant" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>

              <span className="pb-2 text-sm tabular-nums text-muted">
                {lignesTriees.length} livraison{lignesTriees.length > 1 ? 's' : ''} retenue
                {lignesTriees.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Tableau, sur poste de travail (a partir de 768 px) */}
            <div className="hidden md:block">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Livraisons"
                    className="min-w-[52rem]"
                    onSortChange={(descripteur) =>
                      setSorting([
                        {
                          desc: descripteur.direction === 'descending',
                          id: String(descripteur.column),
                        },
                      ])
                    }
                    sortDescriptor={
                      triCourant
                        ? {
                            column: triCourant.id,
                            direction: triCourant.desc ? 'descending' : 'ascending',
                          }
                        : undefined
                    }
                  >
                    <Table.Header>
                      {table.getFlatHeaders().map((header, i) => (
                        <Table.Column
                          allowsSorting={header.column.getCanSort()}
                          className={COLONNES_NOMBRE.includes(header.id) ? 'text-right' : undefined}
                          id={header.id}
                          isRowHeader={i === 0}
                          key={header.id}
                        >
                          {({ sortDirection }) =>
                            header.column.getCanSort() ? (
                              <Table.SortableColumnHeader sortDirection={sortDirection}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </Table.SortableColumnHeader>
                            ) : (
                              <>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </>
                            )
                          }
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body
                      renderEmptyState={() =>
                        isLoading ? null : (
                          <p className="py-8 text-center text-sm text-muted">
                            Aucune livraison trouvée
                          </p>
                        )
                      }
                    >
                      {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                              {/* Autant de cellules que de colonnes, derivees de la liste
                                  elle-meme : un compte ecrit a la main fait tomber la page. */}
                              {livraisonColumns.map((_c, j) => (
                                <Table.Cell key={`sq-${i}-${j}`}>
                                  <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))
                        : lignes.map((row) => (
                            <Table.Row id={row.id} key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <Table.Cell
                                  className={
                                    COLONNES_NOMBRE.includes(cell.column.id)
                                      ? 'text-right tabular-nums'
                                      : undefined
                                  }
                                  key={cell.id}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>

            {/* Cartes tactiles, sur telephone (moins de 768 px) */}
            <div className="space-y-3 p-4 md:hidden">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    className="h-40 animate-pulse rounded-xl bg-surface-secondary"
                    key={`m-skel-${i}`}
                  />
                ))
              ) : lignes.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Aucune livraison trouvée</p>
              ) : (
                lignes.map((row) => {
                  const livraison = row.original;
                  return (
                    <div
                      className="space-y-2 rounded-xl border border-separator bg-surface p-4 shadow-xs"
                      key={row.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            REF-{livraison.refCommande}
                          </p>
                          <p className="text-xs tabular-nums text-muted">
                            {formatDateHeure(livraison.createdAt)}
                          </p>
                        </div>
                        <ActionsLivraison livraison={livraison} />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted">Livreur</span>
                        <span className="min-w-0 text-right text-sm text-foreground">
                          {livraison.nomLivreur}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted">Coût commande</span>
                        <span className="text-sm tabular-nums text-foreground">
                          {formatMontant(livraison.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted">Frais de livraison</span>
                        <span className="text-sm tabular-nums text-foreground">
                          {formatMontant(livraison.fraisLivraison)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted">Commission</span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {formatMontant(livraison.commission)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination
              currentPage={pageCourante}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              onPageChange={setCurrentPage}
              totalItems={lignesTriees.length}
              totalPages={nbPages}
            />
          </>
        )}
      </Card.Content>
    </Card>
  );
}
