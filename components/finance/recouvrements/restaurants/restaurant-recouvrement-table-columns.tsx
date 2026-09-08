import { ColumnDef } from '@tanstack/react-table';
import { IconFileInvoice } from '@tabler/icons-react';

import { LienBouton } from '@/components/commons/LienBouton';
import { IRestaurantRecouvrement } from '@/features/recouvrements/types/restaurant-recouvrement.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { CreerRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/creer-recouvrement-modal';

/*
 * Trois colonnes d'argent se suivent ici et se comparent d'une ligne a l'autre : elles
 * sont alignees a droite, EN-TETE COMPRIS, faute de quoi le titre flotte au-dessus d'une
 * colonne de chiffres qui, elle, est calee sur son bord droit.
 */

export const restaurantRecouvrementTableColumns: ColumnDef<IRestaurantRecouvrement>[] = [
  {
    accessorKey: 'nomRestaurant',
    header: 'Partenaire',
    cell: ({ row }) => <span className="font-semibold">{row.original.nomRestaurant}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'totalFraisLivraisons',
    header: () => <span className="block text-right">Total Livraison</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">{formatCFA(row.original.totalFraisLivraisons || 0)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'totalCommission',
    header: () => <span className="block text-right">Total Commission</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">{formatCFA(row.original.totalCommission || 0)}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'totalFacture',
    header: () => <span className="block text-right">Total Facture</span>,
    cell: ({ row }) => (
      <span className="block text-right font-bold tabular-nums">{formatCFA(row.original.totalFacture || 0)}</span>
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      /*
       * Les deux gestes etaient caches dans un menu shadcn dont le second element
       * enveloppait `CreerRecouvrementModal` en `asChild` : un `<button>` a l'interieur
       * d'un `menuitem`, que le menu referme au moment meme ou la fenetre s'ouvre.
       * Les voici cote a cote. « Factures » est un vrai lien : le comptable ouvre
       * couramment trois partenaires dans trois onglets, ce qu'un bouton lui retirait.
       */
      <div className="flex flex-wrap items-center justify-end gap-2">
        <LienBouton href={`/finance/recouvrement/${row.original.id}/factures`} variante="outline">
          <IconFileInvoice aria-hidden="true" className="size-4" />
          Factures
        </LienBouton>
        <CreerRecouvrementModal restaurantId={row.original.id} />
      </div>
    ),
    enableSorting: false,
  },
];
