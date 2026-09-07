'use client';

import { useEffect, useRef } from 'react';
import { flexRender, Table } from '@tanstack/react-table';
// `Table` est deja pris par TanStack ci-dessus : celui de la bibliotheque est aliase.
import { Card, Spinner, Table as TableauV3 } from '@heroui-v3/react';
import { IGrillePaiementLigne } from '@/features/validation-tickets/grille-de-paiement/types/grille-paiement.type';

interface Props {
  waveTable: Table<IGrillePaiementLigne>;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
}

export default function ApprobationFinaleWaveTable({ waveTable, isFetchingNextPage, hasNextPage, fetchNextPage }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
      },
      { threshold: 0.1 },
    );
    // Observe les deux sentinelles (tableau desktop + liste mobile).
    if (bottomRef.current) observer.observe(bottomRef.current);
    if (bottomRefMobile.current) observer.observe(bottomRefMobile.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage, isFetchingNextPage]);

  return (
    <div className="flex-1 min-w-0 rounded-xl border border-separator bg-surface overflow-hidden">
      <div className="px-5 py-3 border-b border-separator">
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
          Récapitulatif des virements Wave
        </p>
      </div>
      {/* Tableau — desktop uniquement (≥ md) */}
      <TableauV3 className="hidden md:block">
        <TableauV3.ScrollContainer>
          <TableauV3.Content aria-label="Récapitulatif des virements Wave">
            <TableauV3.Header>
              {waveTable.getFlatHeaders().map((header, i) => (
                <TableauV3.Column
                  className="text-[10px] tracking-widest uppercase"
                  id={header.id}
                  isRowHeader={i === 0}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableauV3.Column>
              ))}
            </TableauV3.Header>
            <TableauV3.Body
              renderEmptyState={() => (
                <p className="py-8 text-center text-sm text-muted">Aucun livreur trouvé</p>
              )}
            >
              {waveTable.getRowModel().rows.map((row) => (
                <TableauV3.Row id={row.id} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableauV3.Cell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableauV3.Cell>
                  ))}
                </TableauV3.Row>
              ))}
            </TableauV3.Body>
          </TableauV3.Content>
          {/* La sentinelle vit DANS la zone qui defile : posee dessous, elle restait en
              permanence dans la fenetre et enchainait le chargement de toutes les pages. */}
          <div className="flex items-center justify-center py-2 text-muted" ref={bottomRef}>
            {isFetchingNextPage && <Spinner color="current" size="sm" />}
          </div>
        </TableauV3.ScrollContainer>
      </TableauV3>
      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {waveTable.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun livreur trouvé</p>
        ) : (
          waveTable.getRowModel().rows.map((row) => {
            const ligne = row.original;
            return (
              /*
               * Le cadre etait un `div` habille a la main (fond, bordure, arrondi, ombre,
               * rembourrage). C'est une carte de la bibliotheque : elle porte ce cadre et
               * suit le theme sans qu'on le redise. Ne reste que l'ecart entre les lignes.
               */
              <Card key={row.id} className="gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{ligne.turboy.nom}</p>
                  <p className="text-[11px] text-muted">{ligne.turboy.code}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">N° Wave</span>
                  {ligne.numeroWave ? (
                    <span className="text-right text-sm tabular-nums text-muted">{ligne.numeroWave}</span>
                  ) : (
                    <span className="text-right text-sm text-muted">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Net</span>
                  {/* `text-green-600` etait ecrit en dur, sans variante sombre : depuis que la
                      bascule de theme est dans l'en-tete, le montant a virer restait vert clair
                      sur fond fonce, illisible au moment de verifier une paie. `text-success-soft-foreground`
                      porte le meme sens et a ses deux themes. */}
                  <span className="text-right text-sm font-bold tabular-nums text-success-soft-foreground">
                    {ligne.netAPayer.toLocaleString('fr-FR')}
                  </span>
                </div>
              </Card>
            );
          })
        )}
        <div ref={bottomRefMobile} className="flex items-center justify-center py-1 text-muted">
          {isFetchingNextPage && <Spinner color="current" size="sm" />}
        </div>
      </div>
    </div>
  );
}
