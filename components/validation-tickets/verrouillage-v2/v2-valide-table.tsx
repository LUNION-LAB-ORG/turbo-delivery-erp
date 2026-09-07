'use client';

import { useEffect, useRef } from 'react';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';
import { Skeleton, Spinner, Table } from '@heroui-v3/react';
import EtatErreur from '@/components/commons/EtatErreur';
import { useHauteurDisponible } from '@/hooks/use-hauteur-disponible';
import { CheckCircle } from 'lucide-react';
import { TicketControleV2 } from '@/features/validation-tickets/verrouillage-v2/types/tickets-v2.type';
import { buildV2ValideColumns, V2ValideRowActions } from './v2-valide-columns';
import TicketV2MobileCard from './ticket-v2-mobile-card';

interface V2ValideTableProps {
  tickets: TicketControleV2[];
  totalElements: number;
  isLoading: boolean;
  isError?: boolean;
  onReessayer?: () => void;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onReject: (id: string) => void;
  rejectingId?: string | null;
  /** Lecture seule : masque l'action "Rejeter". */
  readOnly?: boolean;
}

export function V2ValideTable({
  tickets,
  totalElements,
  isLoading,
  isError = false,
  onReessayer,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onReject,
  rejectingId = null,
  readOnly = false,
}: V2ValideTableProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const zoneTableRef = useRef<HTMLDivElement>(null);
  const hauteurTable = useHauteurDisponible(zoneTableRef);
  const bottomRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 },
    );
    // Observe les deux sentinelles (tableau desktop + liste mobile).
    if (bottomRef.current) observer.observe(bottomRef.current);
    if (bottomRefMobile.current) observer.observe(bottomRefMobile.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  const columns = buildV2ValideColumns(onReject, rejectingId, readOnly);

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-xl border border-separator bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-separator">
        <div className="flex items-center gap-2">
          {/* `text-green-600` etait ecrit en dur, sans variante sombre : la coche restait
              au meme vert quel que soit le theme, et se detachait mal du fond fonce.
              `text-success-soft-foreground` porte le meme sens et suit la bascule clair/sombre. */}
          <CheckCircle aria-hidden="true" className="h-4 w-4 text-success-soft-foreground" />
          <div>
            <p className="font-semibold text-foreground">Tickets V2 validés</p>
            <p className="text-xs text-muted">Historique des tickets verrouillés V2</p>
          </div>
        </div>
        <p className="text-xs text-muted">{totalElements} ligne{totalElements > 1 ? 's' : ''}</p>
      </div>
      {/* Tableau — desktop uniquement (≥ md) */}
      {/* Tableau — desktop uniquement (≥ md) */}
      <div className="hidden md:block">
        {/*
         * Le plafond etait un `max-h-[60vh]` ecrit en dur. Sur la fenetre reelle des
         * postes (1000x563), cela faisait 338 px de tableau, soit trois lignes : c'est
         * exactement le defaut deja corrige sur les deux tableaux de tickets, avec son
         * commentaire. La hauteur se MESURE, et le repli ne s'applique que le temps de
         * la mesure.
         */}
        <Table>
          <Table.ScrollContainer
            className="md:h-[calc(100vh-18rem)] md:min-h-[320px]"
            ref={zoneTableRef}
            style={hauteurTable ? { height: hauteurTable } : undefined}
          >
            <Table.Content aria-label="Tickets V2 validés">
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
                      <EtatErreur onReessayer={onReessayer} quoi="les tickets validés V2" />
                    </div>
                  ) : isLoading ? null : (
                    <p className="py-8 text-center text-sm text-muted">Aucun ticket V2 validé</p>
                  )
                }
              >
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                        {table.getFlatHeaders().map((header) => (
                          <Table.Cell key={header.id}>
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
        {/* Le rond de chargement etait dessine a la main (`Loader2` + `animate-spin`) :
            sa couleur et sa vitesse ne suivaient rien. `Spinner` en `color="current"`
            herite du `text-muted` porte par la sentinelle, donc du theme. */}
        <div className="flex items-center justify-center py-3 text-muted" ref={bottomRef}>
          {isFetchingNextPage && <Spinner color="current" size="sm" />}
        </div>
      </div>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            /* Le gabarit garde la hauteur et l'arrondi de la carte qu'il remplace :
               sans cela, la liste saute au moment ou les vraies cartes arrivent. */
            <Skeleton key={`m-skel-${i}`} className="h-52 rounded-xl" />
          ))
        ) : tickets.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun ticket V2 validé</p>
        ) : (
          tickets.map((ticket) => (
            <TicketV2MobileCard
              key={ticket.commandeId}
              ticket={ticket}
              actions={
                readOnly ? undefined : (
                  <V2ValideRowActions
                    ticket={ticket}
                    isRejecting={rejectingId === ticket.commandeId}
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
