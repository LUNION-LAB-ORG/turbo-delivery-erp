import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import { IAccompte } from '@/features/recouvrements/types/accompte.types';

/**
 * Les colonnes du tableau des acomptes.
 *
 * <h3>Ce qui a ete retire</h3>
 * <p>Un composant `AccompteActions`, un menu shadcn avec « Modifier » et « Supprimer »
 * tous deux sans gestionnaire sous un `TODO`, vivait ici avec la colonne qui l'aurait
 * rendu, mise en commentaire. Rien ne l'affichait : c'etait le dernier import de shadcn
 * de ce fichier, pour un menu que personne n'a jamais vu. Une colonne « Statut » etait
 * commentee de la meme facon ; la regle qu'elle portait (montant a zero = en attente)
 * est deja appliquee, elle, par le bandeau de statistiques de l'onglet.</p>
 *
 * <p>Le rendu de la date journalisait par ailleurs la ligne entiere dans la console du
 * navigateur, a chaque rendu de chaque ligne.</p>
 */
export const accompteColumns: ColumnDef<IAccompte>[] = [
  {
    id: 'dateAccompte',
    accessorKey: 'dateAccompte',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateAccompte'));
      return <span className="tabular-nums">{format(date, 'dd/MM/yyyy')}</span>;
    },
    enableSorting: false,
  },
  {
    id: 'montant',
    accessorKey: 'montant',
    // Une colonne d'argent se lit en la comparant a la ligne du dessus : alignee a
    // droite, en-tete comprise, et en chasse tabulaire.
    header: () => <span className="block text-right">Montant</span>,
    cell: ({ row }) => {
      const montant = row.getValue('montant') as number;
      return (
        <span className="block text-right tabular-nums">
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(montant)}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    id: 'nomRestaurant',
    accessorKey: 'nomRestaurant',
    header: 'Partenaire',
  },
];
