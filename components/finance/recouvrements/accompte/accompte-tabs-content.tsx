'use client';

import React, { useState } from 'react';
import { Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { RestaurantSelect } from '../common/restaurant-select';
import { useAccompteQuery } from '@/features/recouvrements/queries/accompte.query';
import { Card, Table } from '@heroui-v3/react';

import { cn } from '@/lib/utils';

import { PaginationTableau } from '../common/pagination-tableau';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { accompteColumns } from '@/features/recouvrements/columns/accompte-columns';
import { DateRange } from 'react-day-picker';
import { AccompteMobileCard } from '@/components/finance/recouvrements/recouvrement-mobile-cards';
import EtatErreur from '@/components/commons/EtatErreur';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';

interface AccompteTabsContentProps {
  restoOpts?: Array<{ label: string; value: string }>;
  isOptionsLoading?: boolean;
}

export function AccompteTabsContent({ restoOpts, isOptionsLoading }: AccompteTabsContentProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedStatuts, setSelectedStatuts] = useState<string[]>([]);
  /*
   * La periode etait FIGEE sur mars 2026, en dur dans le code.
   *
   * <p>L'onglet n'a pas de selecteur de date : quel que soit le jour, il ne montrait que
   * les acomptes de mars 2026. Passe ce mois-la, l'ecran affichait « aucun acompte » a
   * une equipe qui en enregistrait, et il aurait fallu redeployer pour voir avril.</p>
   *
   * <p>Il s'ouvre desormais sur le MOIS COURANT, calcule au montage.</p>
   */
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const maintenant = new Date();
    return {
      from: new Date(maintenant.getFullYear(), maintenant.getMonth(), 1),
      to: new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 0),
    };
  });
  const [filters, setFilters] = useState({
    page: 0,
    size: 10,
  });

  // Utiliser l'API réelle avec tous les filtres
  const {
    data: accomptesData,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAccompteQuery({
    // La pagination etait MORTE : la requete demandait toujours la page 0 avec vingt
    // lignes, pendant que les boutons de page faisaient bouger `filters.page` sans effet.
    // Le tableau annoncait N pages et rendait toujours la premiere, et les totaux ne
    // portaient que sur ces vingt lignes.
    page: filters.page,
    limit: filters.size,
    restaurantId: selectedRestaurant || undefined,
    debut: dateRange?.from,
    fin: dateRange?.to,
    statuts: selectedStatuts.length > 0 ? selectedStatuts : undefined,
  });

  const pagination = {
    pageCount: accomptesData?.totalPages || 1,
    page: filters.page,
    pageSize: filters.size,
    handlePageChange: (newPage: number) => setFilters((f) => ({ ...f, page: newPage - 1 })),
  };

  const table = useReactTable({
    data: accomptesData?.content || [],
    columns: accompteColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination?.pageCount ?? -1,
  });

  const accomptes = accomptesData?.content || [];

  // meme bloc pour les deux rendus (tableau desktop, cartes mobiles) : un seul est visible a la fois
  const zoneErreur = <EtatErreur quoi="les acomptes" onReessayer={() => refetch()} enCours={isFetching} />;

  // Calcul des statistiques à partir des données réelles
  const stats = {
    totalAccompte: accomptes.reduce((sum, a) => sum + a.montant, 0),
    nombreAccomptes: accomptes.length,
    accompteValides: accomptes.filter((a) => a.montant > 0).reduce((sum, a) => sum + a.montant, 0),
    accompteEnAttente: accomptes.filter((a) => a.montant === 0).length,
  };

  // const handleDateChange = (value: DateRange | undefined) => {
  //   setDateRange(value);
  // };
  //
  // const handleStatutsChange = (statuts: string[] | null) => {
  //   setSelectedStatuts(statuts || []);
  // };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <RestaurantSelect
          value={selectedRestaurant}
          onChange={(value) => setSelectedRestaurant(value || '')}
          options={restoOpts || []}
          isLoading={isOptionsLoading}
          placeholder="Tous les restaurants"
          className="w-full sm:w-[280px]"
        />
      </div>

      {/* Bandeau de statistiques : CarteStat, la carte unique de l'ERP.
          Il etait ecrit a la main dans le style shadcn (Card + CardContent, chiffre en
          text-2xl font-bold, icone h-8 w-8), seul rescape de ce dessin dans l'ERP.

          Les couleurs changent, et elles VEULENT desormais dire quelque chose. Elles
          etaient decoratives et arbitraires (vert, bleu, violet, orange), sans rapport
          avec ce que le chiffre raconte. Elles suivent maintenant les jetons du theme :
          le total porte l'accent, un simple comptage est neutre, ce qui est valide est
          au succes, ce qui attend est a l'attention. Le violet disparait : il n'a pas de
          jeton, et il ne signifiait rien.

          sur echec les totaux vaudraient 0 FCFA, ce qui se lit comme un resultat reel */}
      {!isError && (
        <GrilleStats colonnes={4}>
          <CarteStat
            libelle="Total Accompte"
            valeur={formatCFA(stats.totalAccompte)}
            icone={DollarSign}
            ton="primaire"
            accent
          />
          <CarteStat
            libelle="Nombre d'Accomptes"
            valeur={stats.nombreAccomptes}
            icone={Users}
            ton="neutre"
          />
          <CarteStat
            libelle="Accomptes Validés"
            valeur={formatCFA(stats.accompteValides)}
            icone={Calendar}
            ton="succes"
          />
          <CarteStat
            libelle="En attente"
            valeur={stats.accompteEnAttente}
            icone={TrendingUp}
            ton="attention"
          />
        </GrilleStats>
      )}

      {/* Tableau des acomptes.
          La carte venait de shadcn, la derniere bibliotheque doublonnee du projet : deux
          cartes de dessins differents se cotoyaient sur le meme ecran, celle-ci et le
          bandeau de statistiques juste au-dessus. */}
      <Card>
        <Card.Header>
          <Card.Title className="text-lg">Liste des Accomptes</Card.Title>
        </Card.Header>
        <Card.Content>
          {/* Tableau : desktop uniquement (≥ md) */}
          <div className="hidden md:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Acomptes" className="min-w-[48rem]">
                  <Table.Header>
                    {table.getFlatHeaders().map((header, i) => (
                      <Table.Column
                        allowsSorting={header.column.getCanSort()}
                        id={header.id}
                        isRowHeader={i === 0}
                        key={header.id}
                      >
                        {({ sortDirection }) =>
                          header.column.getCanSort() ? (
                            <Table.SortableColumnHeader sortDirection={sortDirection}>
                              {header.isPlaceholder
                                ? ''
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </Table.SortableColumnHeader>
                          ) : (
                            <>
                              {header.isPlaceholder
                                ? ''
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </>
                          )
                        }
                      </Table.Column>
                    ))}
                  </Table.Header>

                  {/* sur echec, l'erreur prend la place du message "Aucun acompte" qui se
                      lirait comme un resultat vide */}
                  <Table.Body
                    renderEmptyState={() =>
                      isLoading ? null : isError ? (
                        <div className="py-6">{zoneErreur}</div>
                      ) : (
                        <p className="py-8 text-center text-sm text-muted">Aucun acompte</p>
                      )
                    }
                  >
                    {isLoading
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                            {table.getFlatHeaders().map((h) => (
                              <Table.Cell key={`sq-${i}-${h.id}`}>
                                <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      : null}

                    {(isLoading || isError ? [] : table.getRowModel().rows).map((row) => (
                      <Table.Row id={row.id} key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <Table.Cell className={cn(isFetching && 'opacity-70')} key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>

              {/*
               * UNE seule pagination.
               *
               * <p>Il y en avait DEUX sous ce tableau. La seconde passait
               * `accomptesData.totalElements` (le nombre d'acomptes) dans `total`, qui
               * attend un nombre de PAGES : elle affichait donc cent trente-sept pages
               * pour cent trente-sept lignes. Et elle changeait l'URL par un
               * `window.history.pushState` direct, que React ne voit pas : cliquer une
               * page réécrivait la barre d'adresse sans rien recharger.</p>
               */}
              {pagination && pagination.pageCount > 1 && (
                <Table.Footer className="justify-center">
                  <PaginationTableau
                    onPage={pagination.handlePageChange}
                    page={pagination.page + 1}
                    total={pagination.pageCount}
                  />
                </Table.Footer>
              )}
            </Table>
          </div>

          {/* Mobile : cartes tactiles (remplace le tableau < md) */}
          <div className={`md:hidden space-y-3 ${isFetching ? 'opacity-70' : ''}`}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={`m-skel-${i}`} className="h-24 rounded-xl bg-surface-secondary animate-pulse" />)
            ) : isError ? (
              zoneErreur
            ) : accomptes.length === 0 ? (
              <p className="text-sm text-muted text-center py-10">Aucun acompte</p>
            ) : (
              accomptes.map((accompte) => <AccompteMobileCard key={accompte.id} accompte={accompte} />)
            )}
            {pagination && pagination.pageCount > 1 && (
              <div className="flex justify-center pt-2">
                <PaginationTableau
                  onPage={pagination.handlePageChange}
                  page={pagination.page + 1}
                  total={pagination.pageCount}
                />
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
