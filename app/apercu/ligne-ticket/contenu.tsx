'use client';

import { Table } from '@heroui-v3/react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import React from 'react';

import {
  createTicketColumns,
  type TicketColumnMeta,
} from '@/components/tickets/table/ticket-table-columns';
import type { Ticket } from '@/types/bon-livraison.model';

/**
 * Une ligne de ticket en cours de saisie, montée seule.
 *
 * <p>Elle ne s'atteint qu'après connexion, sur un tableau chargé. Ce banc rend les VRAIES
 * colonnes, avec le même balisage de cellule que l'écran, pour regarder l'alignement de
 * la rangée sans avoir à se connecter.</p>
 *
 * <p>Ce qu'il a servi à voir : le sélecteur de zone affichait « Zone » au-dessus de son
 * champ, alors que l'en-tête de colonne le dit déjà. Cette ligne de plus, dans cette
 * seule cellule, poussait le champ vers le bas et décalait toute la rangée.</p>
 */

const LIGNE: Ticket = {
  code: '00054555',
  coutLivraison: '1500',
  date: '2026-09-07',
  heure: '12:46',
  id: 'apercu-1',
  isNew: true,
  livreur: 'Kouamé Yannick Kouadio',
  livreurId: 'l1',
  montantCommande: '5000',
  montantLivraison: '1500',
  nomZone: 'ZONE 3 (Limite feu de Bernabé) | ÉGLISE MÉTHODISTE',
  restaurant: 'AGHA ZONE 4',
  restaurantId: 'r1',
  statut: 'EN_ATTENTE',
  zoneId: 'z1',
} as unknown as Ticket;

const META: TicketColumnMeta = {
  authenticatedIds: new Set(),
  editedTickets: new Map(),
  editingIds: new Set(),
  getDisplayTicket: (t: Ticket) => t,
  isSavingEdit: false,
  isSavingNew: false,
  livreurOptions: [{ label: 'Kouamé Yannick Kouadio', value: 'l1' }],
  newTicketIds: new Set(['apercu-1']),
  onAuthentifier: () => undefined,
  onCancelEdit: () => undefined,
  onCancelNew: () => undefined,
  onDeleteRow: () => undefined,
  onEditRow: () => undefined,
  onSaveEdit: () => undefined,
  onSaveNew: () => undefined,
  onTicketChange: () => undefined,
  onTicketPatch: () => undefined,
  permissions: {
    canAuthentifier: true,
    canCreate: true,
    canDelete: true,
    canUpdate: true,
    isAdmin: true,
  },
  restaurantOptions: [{ label: 'AGHA ZONE 4', value: 'r1' }],
};

export default function ApercuLigneTicket() {
  const columns = React.useMemo(() => createTicketColumns(), []);
  const table = useReactTable({
    columns,
    data: [LIGNE],
    getCoreRowModel: getCoreRowModel(),
    getRowId: (l) => l.id,
    meta: META,
  });

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-semibold">Banc de la ligne de ticket</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        La rangée en cours de saisie, avec les vraies colonnes. Les champs doivent partager
        une même ligne de base : aucune cellule ne doit être plus haute que ses voisines.
      </p>

      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Ligne de ticket">
            <Table.Header>
              {table.getFlatHeaders().map((header, i) => (
                <Table.Column
                  className="text-xs font-medium whitespace-nowrap sm:text-sm"
                  id={header.id}
                  isRowHeader={i === 0}
                  key={header.id}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.map((row) => (
                <Table.Row id={row.id} key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Cell className="px-2 py-1 text-xs whitespace-nowrap" key={cell.id}>
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
  );
}
