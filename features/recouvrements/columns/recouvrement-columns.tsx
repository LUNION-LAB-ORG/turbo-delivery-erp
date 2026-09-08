'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@heroui-v3/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { IRecouvrement } from '@/features/revenus/types/recouvrement/recouvrement.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { createUrlFile } from '@/utils/createUrlFile';
import { ModifierRecouvrementModal } from '@/features/revenus/components/recouvrement/recouvrement-pret/modifier-recouvrement-modal';
import { useSupprimerRecouvrementMutation } from '@/features/recouvrements/queries/recouvrement.mutation';
import { IFacture } from '@/features/recouvrements/types';

/**
 * Les trois gestes d'une ligne de recouvrement.
 *
 * <h3>Ce qui change</h3>
 * <p>Les boutons venaient de shadcn, la derniere bibliotheque doublonnee du projet : ils
 * ecoutent `onClick`, celui de la v3 ecoute `onPress`. Deux d'entre eux etaient de
 * simples icones sans nom accessible : un lecteur d'ecran annoncait « bouton » trois fois
 * par ligne, sur autant de lignes que le tableau en compte.</p>
 *
 * <p>La fenetre de confirmation etait un `AlertDialog` de shadcn, et son bouton rouge
 * etait peint a la main en `bg-destructive`. Elle se refermait par ailleurs au clic,
 * AVANT que le serveur ait repondu : un echec de suppression laissait l'operateur devant
 * une ligne toujours la, sans savoir si son geste avait porte. Elle attend desormais la
 * reponse.</p>
 */
export function RecouvrementActionsCell({ recouvrement }: { recouvrement: IRecouvrement }) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openSuppression, setOpenSuppression] = useState(false);
  const { mutate: supprimerMutation, isPending: isDeleting } = useSupprimerRecouvrementMutation();

  const handleDownload = () => {
    if (recouvrement.preuve) {
      const url = createUrlFile(recouvrement.preuve, 'backend');
      window.open(url, '_blank');
    }
  };

  const handleDelete = () => {
    supprimerMutation(recouvrement.id, {
      onSuccess: () => setOpenSuppression(false),
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Modifier le recouvrement"
          isIconOnly
          onPress={() => setOpenEdit(true)}
          size="sm"
          variant="outline"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>

        <Button
          isDisabled={!recouvrement.preuve}
          onPress={handleDownload}
          size="sm"
          variant="outline"
        >
          <Download aria-hidden="true" className="size-4" />
          <span>Preuve</span>
        </Button>

        <Button
          aria-label="Supprimer le recouvrement"
          isDisabled={isDeleting}
          isIconOnly
          onPress={() => setOpenSuppression(true)}
          size="sm"
          variant="danger"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <FenetreAction
        destructif
        enAttente={isDeleting}
        libelleAction="Supprimer"
        onAction={handleDelete}
        onFermer={() => setOpenSuppression(false)}
        ouvert={openSuppression}
        titre="Supprimer le recouvrement ?"
      >
        <p className="text-sm text-foreground">
          Cette action est irréversible. Le recouvrement de{' '}
          <strong className="tabular-nums">{formatCFA(recouvrement.montant)}</strong> du{' '}
          <strong className="tabular-nums">
            {format(new Date(recouvrement.dateRecouvrement), 'dd MMM yyyy', { locale: fr })}
          </strong>{' '}
          sera définitivement supprimé, et la ou les factures liées repartent à l’étape
          « validée, non payée » (dépôts, visa et orientation des fonds effacés).
        </p>
      </FenetreAction>

      <ModifierRecouvrementModal recouvrement={recouvrement} open={openEdit} onOpenChange={setOpenEdit} />
    </>
  );
}

export const recouvrementColumns: ColumnDef<IRecouvrement>[] = [
  {
    accessorKey: 'dateRecouvrement',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('dateRecouvrement'));
      return <span className="tabular-nums">{format(date, 'dd MMM yyyy', { locale: fr })}</span>;
    },
  },
  {
    accessorKey: 'nomRestaurant',
    header: 'Restaurant',
    cell: ({ row }) => row.getValue('nomRestaurant') || '-',
  },
  {
    accessorKey: 'factures',
    header: 'Factures',
    cell: ({ row }) => {
      const factures = row.getValue('factures') as IFacture[];
      if (factures && factures.length > 0) {
        return factures.map((f) => f.code).join(', ');
      }
      return '-';
    },
  },
  {
    accessorKey: 'montant',
    // Une colonne d'argent se compare a la ligne du dessus : alignee a droite,
    // en-tete comprise, et en chasse tabulaire.
    header: () => <span className="block text-right">Montant</span>,
    cell: ({ row }) => <span className="block text-right tabular-nums">{formatCFA(row.getValue('montant'))}</span>,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <RecouvrementActionsCell recouvrement={row.original} />,
  },
];
