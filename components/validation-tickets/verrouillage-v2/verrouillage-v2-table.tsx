'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Skeleton, Spinner, Table } from '@heroui-v3/react';
import EtatErreur from '@/components/commons/EtatErreur';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { buildVerrouillageV2Columns, VerrouillageV2RowActions } from './verrouillage-v2-columns';
import TicketV2MobileCard from './ticket-v2-mobile-card';

interface VerrouillageV2TableProps {
  tickets: TicketControleV2[];
  totalElements: number;
  isLoading: boolean;
  isError?: boolean;
  onReessayer?: () => void;
  validatingId: string | null;
  onValidate: (id: string) => void;
  onReject: (id: string) => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Lecture seule : masque la colonne d'actions (Valider V2 / Rejeter). */
  readOnly?: boolean;
}

export function VerrouillageV2Table({
  tickets,
  totalElements,
  isLoading,
  isError = false,
  onReessayer,
  validatingId,
  onValidate,
  onReject,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  readOnly = false,
}: VerrouillageV2TableProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomRefMobile = useRef<HTMLDivElement>(null);
  const zoneTableRef = useRef<HTMLDivElement>(null);
  const hauteurTable = useHauteurDisponible(zoneTableRef);

  useEffect(() => {
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    // Observe les deux sentinelles (tableau desktop + liste mobile) : celle qui
    // est masquée par `display:none` ne déclenche jamais d'intersection.
    if (bottomRef.current) observer.observe(bottomRef.current);
    if (bottomRefMobile.current) observer.observe(bottomRefMobile.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  const columns = useMemo(
    () => buildVerrouillageV2Columns(onValidate, onReject, validatingId, readOnly),
    [onValidate, onReject, validatingId, readOnly],
  );

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-separator bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-separator">
        <div>
          <p className="font-semibold text-foreground">Récapitulatif final</p>
          <p className="text-xs text-muted">À vérifier avant verrouillage définitif</p>
        </div>
        <p className="text-xs text-muted">{totalElements} ligne{totalElements > 1 ? 's' : ''}</p>
      </div>
      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block">
        {/*
         * Le plafond etait un `max-h-[60vh]` ecrit en dur : sur la fenetre reelle des
         * postes (1000x563), 338 px, soit trois lignes visibles sur un recapitulatif
         * qu'on relit AVANT de verrouiller definitivement. La hauteur se mesure.
         */}
        <Table>
          <Table.ScrollContainer
            className="md:h-[calc(100vh-18rem)] md:min-h-[320px]"
            ref={zoneTableRef}
            style={hauteurTable ? { height: hauteurTable } : undefined}
          >
            <Table.Content aria-label="Récapitulatif final des tickets V2">
              <Table.Header>
                {table.getFlatHeaders().map((header, i) => (
                  <Table.Column id={header.id} isRowHeader={i === 0} key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.Column>
                ))}
              </Table.Header>
              {/*
               * La CLE React doit valoir l'`id` de la collection.
               *
               * <p>Elle valait l'index — 0, 1, 2 — tandis que les vraies lignes portent
               * `key={row.id}`, et l'identifiant par defaut de TanStack EST l'index sous
               * forme de chaine : « 0 », « 1 »… React voyait donc la meme cle au moment
               * ou le squelette cede la place aux donnees, reutilisait l'element, et
               * react-aria recevait un `id` qui change sur un element deja monte. Il leve
               * « Cannot change the id of an item », et la page entiere tombe sur son
               * garde-fou.</p>
               */}
              <Table.Body
                renderEmptyState={() =>
                  /* Un echec de chargement ne doit pas se lire comme une liste vide. */
                  isError ? (
                    <div className="py-6">
                      <EtatErreur onReessayer={onReessayer} quoi="les tickets à verrouiller" />
                    </div>
                  ) : isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">Aucun ticket trouvé</p>
                  )
                }
              >
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {table.getFlatHeaders().map((header) => (
                          <Table.Cell key={header.id}>
                            {/* La hauteur reste en classe : un Skeleton sans dimension n'occupe rien et ne se voit pas. */}
                            <Skeleton className="h-4" />
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
        </Table>
        {/*
         * `text-muted` est pose sur la sentinelle, pas sur le Spinner : la couleur
         * du composant se choisit par sa prop `color`, et `current` la fait heriter
         * du conteneur. Une classe de couleur posee sur le Spinner lui-meme serait
         * ecrasee par ses propres styles, et l'attente repasserait en accent vif
         * alors que ce n'est qu'un chargement de page suivante, pas une action.
         */}
        <div className="flex items-center justify-center py-3 text-muted" ref={bottomRef}>
          {isFetchingNextPage && <Spinner color="current" size="sm" />}
        </div>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            /* Meme gabarit que la carte qui va prendre sa place : sans hauteur ni rayon, la liste sauterait au chargement. */
            <Skeleton key={`m-skel-${i}`} className="h-52 rounded-xl" />
          ))
        ) : tickets.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun ticket trouvé</p>
        ) : (
          tickets.map((ticket) => (
            <TicketV2MobileCard
              key={ticket.commandeId}
              ticket={ticket}
              actions={
                readOnly ? undefined : (
                  <VerrouillageV2RowActions
                    ticket={ticket}
                    isValidating={validatingId === ticket.commandeId}
                    onValidate={onValidate}
                    onReject={onReject}
                    fullWidth
                  />
                )
              }
            />
          ))
        )}
        <div ref={bottomRefMobile} className="flex items-center justify-center py-1 text-muted">
          {isFetchingNextPage && <Spinner color="current" size="sm" />}
        </div>
      </div>
    </div>
  );
}
