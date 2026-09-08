'use client';

import React from 'react';
import { Button, Checkbox, Spinner, Tooltip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArchiveRestore } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { IArchiveBonLivraisonVm } from '@/features/tickets/types/tickets.type';

export interface TicketArchivesColumnMeta {
  onRestoreRow: (commandeId: string) => void;
  isRestoringId: string | null;
  canRestore: boolean;
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy à HH:mm', { locale: fr });
  } catch {
    return dateStr;
  }
}

interface AgentCellProps {
  agent: { nom: string; prenoms: string } | null | undefined;
  date?: string | null;
}

function AgentCell({ agent, date }: AgentCellProps) {
  if (!agent) return <span className="text-muted">—</span>;
  const formatted = formatDateTime(date);
  return (
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-foreground">{`${agent.prenoms} ${agent.nom}`}</span>
      {formatted && <span className="text-[11px] text-muted">{formatted}</span>}
    </div>
  );
}

/**
 * Les colonnes des tickets archives.
 *
 * <h3>Ce qui change</h3>
 * <p>La case a cocher venait de la SECONDE bibliotheque de composants ; c'est celle de la
 * bibliotheque unique, sortie du contexte de selection de la table.</p>
 *
 * <p>Les trois colonnes d'argent — cout de livraison, cout de commande, commission —
 * etaient alignees a GAUCHE en chasse proportionnelle : deux montants de la meme ligne ne
 * se comparaient pas, et « 1 000 » sous « 900 » ne se lisait pas comme dix fois plus. Elles
 * s'alignent a droite en chasse tabulaire, en-tetes compris, comme dans l'onglet « Tous les
 * tickets » a cote.</p>
 */
export const ticketArchivesColumns: ColumnDef<IArchiveBonLivraisonVm>[] = [
  {
    id: 'select',
    /*
     * `slot={null}` : dans un `Table` v3, la case est branchee d'office sur le contexte
     * de selection de la table, qui exige `slot="selection"` et fait tomber la page en
     * 500 sans lui. Ici la selection est celle de TanStack — c'est elle que lisent la
     * restauration en masse et le compteur — on sort donc du contexte.
     */
    header: ({ table }) => (
      <Checkbox
        aria-label="Tout sélectionner"
        isIndeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        isSelected={table.getIsAllPageRowsSelected()}
        onChange={(coche) => table.toggleAllPageRowsSelected(coche)}
        slot={null}
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Content>
      </Checkbox>
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Sélectionner la ligne"
        isSelected={row.getIsSelected()}
        onChange={(coche) => row.toggleSelected(coche)}
        slot={null}
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Content>
      </Checkbox>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'reference',
    header: 'Code Check',
    cell: ({ row }) => <span className="text-xs">{row.original.reference}</span>,
  },
  {
    accessorKey: 'livreur',
    header: 'Livreur',
    cell: ({ row }) => <span className="text-xs">{row.original.livreur}</span>,
  },
  {
    accessorKey: 'restaurant',
    header: 'Partner',
    /*
     * Le nom du partenaire etait peint en `text-blue-500`, une couleur de palette brute
     * posee sur une CATEGORIE : elle n'appelle aucun geste, ce n'est pas un lien, et
     * l'onglet « Tous les tickets » rend la meme colonne en texte ordinaire. Deux
     * traitements de la meme donnee sur les deux onglets du meme ecran.
     */
    cell: ({ row }) => <span className="text-xs">{row.original.restaurant}</span>,
  },
  {
    accessorKey: 'nomZone',
    header: 'Zone',
    cell: ({ row }) => (
      <Tooltip>
        <span className="line-clamp-2 max-w-56 text-xs">{row.original.nomZone ?? 'Inconnue'}</span>
        <Tooltip.Content>{row.original.nomZone ?? 'Zone inconnue'}</Tooltip.Content>
      </Tooltip>
    ),
  },
  {
    accessorKey: 'coutLivraison',
    header: () => <span className="block text-right">Montant de Livraison</span>,
    cell: ({ row }) => (
      <span className="block text-right text-xs tabular-nums">{formatCFA(row.original.coutLivraison)}</span>
    ),
  },
  {
    accessorKey: 'coutCommande',
    header: () => <span className="block text-right">Montant de Commande</span>,
    cell: ({ row }) => (
      <span className="block text-right text-xs tabular-nums">{formatCFA(row.original.coutCommande)}</span>
    ),
  },
  {
    accessorKey: 'commission',
    header: () => <span className="block text-right">Commission</span>,
    cell: ({ row }) => (
      <span className="block text-right text-xs tabular-nums">{formatCFA(row.original.commission ?? 0)}</span>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => <span className="text-xs">{formatDateFR(row.original.date)}</span>,
  },
  {
    accessorKey: 'heure',
    header: 'Heure',
    cell: ({ row }) => <span className="text-xs">{formatHoursMinutes(row.original.heure)}</span>,
  },
  {
    id: 'deletedAt',
    header: 'Supprimé',
    enableSorting: false,
    cell: ({ row }) => <AgentCell agent={row.original.deletedByUser} date={row.original.deletedAt} />,
  },
  {
    id: 'motifAnnulation',
    header: 'Motif',
    enableSorting: false,
    cell: ({ row }) => {
      const motif = row.original.motifAnnulation;
      if (!motif) return <span className="text-muted">—</span>;
      return (
        <Tooltip>
          <span className="line-clamp-2 max-w-56 text-xs">{motif}</span>
          <Tooltip.Content>{motif}</Tooltip.Content>
        </Tooltip>
      );
    },
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row, table }) => {
      const meta = table.options.meta as TicketArchivesColumnMeta;
      if (!meta.canRestore) return null;
      const isRestoring = meta.isRestoringId === row.original.commandeId;
      return (
        <Tooltip>
          <Button
            aria-label="Restaurer ce ticket"
            isIconOnly
            isPending={isRestoring}
            onPress={() => meta.onRestoreRow(row.original.commandeId)}
            size="sm"
            variant="primary"
          >
            {isRestoring ? <Spinner color="current" size="sm" /> : <ArchiveRestore aria-hidden="true" className="size-4" />}
          </Button>
          <Tooltip.Content>Restaurer ce ticket</Tooltip.Content>
        </Tooltip>
      );
    },
  },
];
