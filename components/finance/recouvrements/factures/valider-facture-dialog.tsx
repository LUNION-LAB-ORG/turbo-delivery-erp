'use client';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useValiderFactureMutation } from '@/features/recouvrements/queries/facture.mutation';

interface ValiderFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * La fenetre venait de shadcn, la derniere bibliotheque doublonnee du projet : son
 * `AlertDialog` rendait un dialogue de plus, avec ses propres boutons, a cote du `Modal`
 * de la v3 que porte tout le reste de l'ERP. `FenetreAction` est la coquille unique.
 */
export const ValiderFactureDialog = ({ facture, open, onOpenChange }: ValiderFactureDialogProps) => {
  const { mutate: validerFacture, isPending } = useValiderFactureMutation();

  const handleValidate = () => {
    validerFacture(facture.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <FenetreAction
      enAttente={isPending}
      libelleAction="Confirmer"
      onAction={handleValidate}
      onFermer={() => onOpenChange(false)}
      ouvert={open}
      titre="Valider la facture"
    >
      <p className="text-sm text-foreground">
        Êtes-vous sûr de vouloir valider cette facture pour le restaurant{' '}
        <strong>{facture.restaurantName}</strong> d&apos;un montant de{' '}
        <strong className="tabular-nums">{formatCFA(facture.montant || 0)}</strong> ?
      </p>
    </FenetreAction>
  );
};
