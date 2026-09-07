'use client';

import React, { useState } from 'react';
import { flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from '@tanstack/react-table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { AddInvestModal } from '../creer-invest/add-invest-modal';
import { useInvestissementList } from '@/features/revenus/hooks/use-investissement-list';
import { Input, Label, SearchField, Table } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import DateFilterInput from '@/components/finance/date-filter-input';
import { investissementColumns, getDeadlineColor } from './invest-columns';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';
import { InvestDetailModal } from './invest-detail-modal';
import { ModifierInvestModal } from '../modifier/modifier-invest-modal';
import SupprimerInvestModal from '../supprimer/supprimer-invest-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import EtatErreur from '@/components/commons/EtatErreur';

export default function InvestissementList() {
  const { investissements, isLoading, isFetching, isError, refetch, filters, handleFilterChange, handleDateChange, pagination } = useInvestissementList();
  const [sorting, setSorting] = useState<SortingState>([]);


  const table = useReactTable({
    data: investissements || [],
    columns: investissementColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card className="my-6">
      <CardHeader className="flex flex-row items-center justify-between">
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
        <div className="flex gap-2">
          <DateFilterInput variant="outline" filters={filters} handleDateChange={handleDateChange} />
          <AddInvestModal />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Double rendu : le tableau desktop et les cartes mobiles affichaient tous
            deux « Aucun investissement ». Les deux sont remplaces ensemble. */}
        {isError ? (
          <EtatErreur quoi="les investissements" onReessayer={() => refetch()} enCours={isFetching} />
        ) : (
        <>
        <div className="hidden md:block">
          <div className="space-y-4">
            {/* Tableau HeroUI */}
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Investissements">
                  <Table.Header>
                    {table.getFlatHeaders().map((header, i) => (
                      <Table.Column
                        allowsSorting={header.column.getCanSort()}
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
                              <Table.Cell key={cell.id}>
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
        </div>

        {/* Mobile — cartes tactiles (remplace le tableau < md) */}
        <div className="md:hidden space-y-3 p-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={`m-skel-${i}`} className="h-32 rounded-xl bg-surface-secondary animate-pulse" />)
          ) : (investissements || []).length === 0 ? (
            <p className="text-sm text-muted text-center py-10">Aucun investissement</p>
          ) : (
            (investissements || []).map((inv) => (
              <div key={inv.id} className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground min-w-0 wrap-break-word">{inv.nomInvestisseur}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <InvestDetailModal investissement={inv} />
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <ModifierInvestModal investissement={inv} />
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <SupprimerInvestModal investissement={inv} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">Date</span>
                  <span className="text-sm text-foreground">{formatDateFR(inv.dateInvestissement)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">Montant du prêt</span>
                  <span className="text-sm font-semibold text-foreground">{formatCFA(inv.montant)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">Échéance</span>
                  <span className={`text-sm ${getDeadlineColor(inv.deadline)}`}>{formatDateFR(inv.deadline)}</span>
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
      </CardContent>
    </Card>
  );
}
