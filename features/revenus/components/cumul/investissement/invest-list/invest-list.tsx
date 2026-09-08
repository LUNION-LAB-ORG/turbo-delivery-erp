'use client';

import { Card, Label, SearchField, Table } from '@heroui-v3/react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import DateFilterInput from '@/components/finance/date-filter-input';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { useInvestissementList } from '@/features/revenus/hooks/use-investissement-list';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';

import {
  ActionsInvestissement,
  COLONNES_NOMBRE,
  getDeadlineColor,
  investissementColumns,
} from './invest-columns';
import { AddInvestModal } from '../creer-invest/add-invest-modal';

export default function InvestissementList() {
  const {
    filters,
    handleDateChange,
    handleFilterChange,
    investissements,
    isError,
    isFetching,
    isLoading,
    pagination,
    refetch,
  } = useInvestissementList();
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    columns: investissementColumns,
    data: investissements || [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  /*
   * Les en-tetes portaient `allowsSorting` et un indicateur de tri, mais `Table.Content` ne
   * recevait ni `sortDescriptor` ni `onSortChange` : la fleche s'affichait, se survolait, et
   * le tableau ne se triait jamais. Le tri de `useReactTable` etait branche dans le vide.
   */
  const triCourant = sorting[0];

  return (
    <Card className="my-6">
      <Card.Header className="flex-row flex-wrap items-end justify-between gap-3">
        {/* Un champ de recherche sans LIBELLE : le seul indice de ce qu'on y cherche
            etait un texte de substitution, qui disparait des la premiere lettre tapee. */}
        <SearchField
          className="max-w-sm"
          onChange={(v) => handleFilterChange('nomInvestisseur', v)}
          value={filters.nomInvestisseur ?? ''}
        >
          <Label>Investisseur</Label>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Rechercher par nom" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
        <div className="flex flex-wrap items-end gap-2">
          <DateFilterInput filters={filters} handleDateChange={handleDateChange} variant="outline" />
          <AddInvestModal />
        </div>
      </Card.Header>
      <Card.Content className="p-0">
        {/* Double rendu : le tableau desktop et les cartes mobiles affichaient tous
            deux « Aucun investissement ». Les deux sont remplaces ensemble. */}
        {isError ? (
          <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="les investissements" />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label="Investissements"
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
                          {/* Tous les en-tetes etaient peints en ROUGE DE MARQUE. */}
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
                          <p className="py-8 text-center text-sm text-muted">Aucun investissement</p>
                        )
                      }
                    >
                      {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                              {investissementColumns.map((c, j) => (
                                <Table.Cell key={j}>
                                  <div className="h-4 w-full animate-pulse rounded bg-surface-secondary" />
                                </Table.Cell>
                              ))}
                            </Table.Row>
                          ))
                        : table.getRowModel().rows.map((row) => (
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
                {(pagination?.pageCount ?? 0) > 1 && (
                  <Table.Footer>
                    <PaginationTableau
                      onPage={pagination.handlePageChange}
                      page={filters.page + 1}
                      total={pagination?.pageCount ?? 1}
                    />
                  </Table.Footer>
                )}
              </Table>
            </div>

            {/* Cartes tactiles, sur telephone (moins de 768 px) */}
            <div className="space-y-3 p-4 md:hidden">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" key={`m-skel-${i}`} />
                ))
              ) : (investissements || []).length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">Aucun investissement</p>
              ) : (
                (investissements || []).map((inv) => (
                  <div
                    className="space-y-2 rounded-xl border border-separator bg-surface p-4 shadow-xs"
                    key={inv.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-semibold wrap-break-word text-foreground">
                        {inv.nomInvestisseur}
                      </p>
                      <ActionsInvestissement investissement={inv} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">Date</span>
                      <span className="text-sm tabular-nums text-foreground">
                        {formatDateFR(inv.dateInvestissement)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">Montant du prêt</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCFA(inv.montant)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted">Échéance</span>
                      <span className={`text-sm tabular-nums ${getDeadlineColor(inv.deadline)}`}>
                        {formatDateFR(inv.deadline)}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {(pagination?.pageCount ?? 0) > 1 && (
                <div className="flex justify-center pt-2">
                  <PaginationTableau
                    onPage={pagination.handlePageChange}
                    page={filters.page + 1}
                    total={pagination?.pageCount ?? 1}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
