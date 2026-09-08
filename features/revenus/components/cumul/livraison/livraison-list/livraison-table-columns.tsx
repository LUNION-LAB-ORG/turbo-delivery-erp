'use client';

import { Button } from '@heroui-v3/react';
import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { useState } from 'react';

import { ILivraison } from '@/features/revenus/types/livraison.types';
import { formatMontant } from '@/utils/format.utils';

import { LivraisonDetailModal } from './livraison-detail-modal';

/** Les colonnes de CHIFFRES : chasse tabulaire et alignement a droite, des deux cotes. */
export const COLONNES_NOMBRE = ['totalAmount', 'fraisLivraison', 'commission'];

export function formatDateHeure(dateString: string) {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateString;
  }
}

/**
 * Le geste d'une ligne de livraison : la lire en detail.
 *
 * <h3>Ce qui change</h3>
 * <p>Il y avait un MENU pour un seul element, et cet element contenait la fenetre
 * complete avec son propre declencheur : un `<button>` nu place a l'interieur d'un
 * `DropdownMenuItem`. Un element interactif dans un autre n'a pas de comportement defini :
 * le clavier n'atteignait jamais le bouton interne, et il fallait un
 * `onSelect={(e) => e.preventDefault()}` pour empecher le menu de se fermer avant
 * l'ouverture de la fenetre. Deux clics pour un seul geste.</p>
 *
 * <p>Le bouton du menu etait par ailleurs peint en ROUGE DE MARQUE sur chaque ligne : un
 * tableau de cinquante livraisons devenait une colonne rouge, et il ne restait plus rien
 * pour signaler ce qui appelle vraiment une action.</p>
 *
 * <p>Le meme composant sert au tableau et aux cartes tactiles, qui montaient chacun leur
 * copie : deux corrections a faire, ou une a oublier.</p>
 */
export function ActionsLivraison({ livraison }: { livraison: ILivraison }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button
        aria-label={`Voir le détail de la livraison REF-${livraison.refCommande}`}
        onPress={() => setOuvert(true)}
        size="sm"
        variant="ghost"
      >
        <Eye aria-hidden="true" className="size-4" />
        Voir détails
      </Button>

      <LivraisonDetailModal
        livraison={livraison}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
      />
    </>
  );
}

/**
 * Les colonnes de la liste des livraisons.
 *
 * <p>« Commission(%) » titrait une colonne qui affichait un MONTANT suivi de « XOF » : le
 * pourcentage n'existe pas, la valeur est le champ `fraisLivraison`. Elle porte son nom.
 * La commission, elle, est bien un montant et manquait au tableau alors que c'est le
 * revenu que cette page mesure.</p>
 *
 * <p>Les montants sortaient BRUTS : « 12500 » a cote de « 1500 XOF », deux ecritures pour
 * la meme monnaie sur une meme ligne. Ils passent tous par `formatMontant`.</p>
 */
export const livraisonColumns: ColumnDef<ILivraison>[] = [
  {
    accessorKey: 'refCommande',
    cell: ({ row }) => <span className="font-medium">{row.original.refCommande}</span>,
    header: 'Référence',
  },
  {
    accessorKey: 'createdAt',
    cell: ({ row }) => (
      <span className="tabular-nums">{formatDateHeure(row.original.createdAt)}</span>
    ),
    header: 'Date et heure',
  },
  {
    accessorKey: 'nomLivreur',
    cell: ({ row }) => row.original.nomLivreur,
    header: 'Livreur',
  },
  {
    accessorKey: 'totalAmount',
    cell: ({ row }) => formatMontant(row.original.totalAmount),
    header: 'Coût commande',
  },
  {
    accessorKey: 'fraisLivraison',
    cell: ({ row }) => formatMontant(row.original.fraisLivraison),
    header: 'Frais de livraison',
  },
  {
    accessorKey: 'commission',
    cell: ({ row }) => formatMontant(row.original.commission),
    header: 'Commission',
  },
  {
    cell: ({ row }) => <ActionsLivraison livraison={row.original} />,
    enableGlobalFilter: false,
    enableSorting: false,
    header: 'Actions',
    id: 'actions',
  },
];
