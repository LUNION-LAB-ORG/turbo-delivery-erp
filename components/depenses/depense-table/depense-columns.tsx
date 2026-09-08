import { Chip } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import React from 'react';

import { ModifierDepenseModal } from '@/features/depenses/components/modifier/modifier-depenses-modal';
import SupprimerDepenseModal from '@/features/depenses/components/supprimer/suprime-depense';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * Le libelle du rythme d'une depense.
 *
 * <p>Il rendait aussi une COULEUR : le quotidien en rouge de marque, l'hebdomadaire en
 * teinte pleine, le mensuel en gris, l'annuel dans une variante « square » propre a
 * l'ancienne bibliotheque. Une periodicite n'appelle aucun geste et rien n'y va bien ni
 * mal ; le rouge de cet ERP est reserve a ce qu'on doit traiter. Les quatre rythmes se
 * lisent maintenant dans la meme etiquette neutre, et seul le mot les distingue.</p>
 */
export const formatTypeDepense = (typeDepense: string | null | undefined): { label: string } => {
  if (!typeDepense) return { label: 'Variable' };

  switch (typeDepense.toUpperCase()) {
    case 'QUOTIDIEN':
      return { label: 'Quotidien' };
    case 'HEBDOMADAIRE':
      return { label: 'Hebdomadaire' };
    case 'MENSUEL':
      return { label: 'Mensuel' };
    case 'ANNUEL':
      return { label: 'Annuel' };
    default:
      return { label: typeDepense };
  }
};

/**
 * Une date de la ligne, ou un tiret quand elle est illisible.
 *
 * <p>`new Date(undefined)` rend « Invalid Date » a l'ecran ; un tiret dit la meme chose
 * sans faire croire a une valeur.</p>
 */
export const formatDateDepense = (valeur: string | null | undefined): string => {
  if (!valeur) return '-';
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy');
};

/**
 * L'etiquette de rythme, partagee par le tableau et la carte tactile.
 */
export function EtiquetteTypeDepense({ typeDepense }: { typeDepense: string | null | undefined }) {
  return (
    <Chip size="sm" variant="soft">
      <Chip.Label>{formatTypeDepense(typeDepense).label}</Chip.Label>
    </Chip>
  );
}

/**
 * Les gestes d'une depense : modifier, supprimer.
 *
 * <p>Ils vivaient dans un menu deroulant dont chaque entree CONTENAIT une fenetre de
 * dialogue entiere, neutralisee par un `onSelect` qui annulait la selection. Deux gestes
 * derriere un menu, c'est un clic de plus a chaque ligne pour n'y trouver que deux
 * lignes. Ils sont poses cote a cote, chacun avec son infobulle : le libelle reste lisible
 * sans occuper la largeur d'une colonne sur une fenetre de 1000 px.</p>
 */
export const DepenseActions = React.memo(({ depense }: { depense: IDepense }) => {
  return (
    <div className="flex items-center justify-end gap-1">
      <ModifierDepenseModal depense={depense} />
      <SupprimerDepenseModal depense={depense} />
    </div>
  );
});

DepenseActions.displayName = 'DepenseActions';

export const depenseColumns: ColumnDef<IDepense>[] = [
  {
    id: 'date_ajout',
    accessorKey: 'createdAt',
    header: 'Date d\'ajout',
    /*
     * Cette colonne annonce la date d'AJOUT et rendait `dateDepense`, celle de la colonne
     * suivante : les deux dates etaient donc toujours identiques a l'ecran, alors que
     * l'export CSV, lui, sortait bien `createdAt` sous « Ajoute le ».
     */
    cell: ({ row }) => formatDateDepense(row.original.createdAt),
    enableSorting: false,
  },
  {
    id: 'date_depense',
    accessorKey: 'dateDepense',
    header: 'Date de comptabilisation',
    cell: ({ row }) => formatDateDepense(row.original.dateDepense),
    enableSorting: false,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description,
    enableSorting: false,
  },
  {
    id: 'categorie',
    accessorFn: (row) => row.categorie?.nomCategorie ?? '',
    header: 'Catégorie',
    cell: ({ row }) => row.original.categorie?.nomCategorie ?? '-',
    enableSorting: false,
  },
  {
    id: 'typeDepense',
    accessorKey: 'typeDepense',
    header: 'Type de dépense',
    cell: ({ row }) => <EtiquetteTypeDepense typeDepense={row.original.typeDepense} />,
    enableSorting: false,
  },
  {
    id: 'montant',
    accessorKey: 'montant',
    /*
     * L'en-tete et la cellule portent l'alignement : la cellule du tableau est rendue par
     * `depense-table/index.tsx`, qui ne connait pas les colonnes une a une.
     */
    header: () => <span className="block text-right">Montant</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">{formatCFA(row.original.montant)}</span>
    ),
    enableSorting: false,
  },
  {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <DepenseActions depense={row.original} />,
    enableSorting: false,
  },
];
