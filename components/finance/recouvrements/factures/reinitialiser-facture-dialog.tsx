'use client';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useReinitialiserFactureMutation } from '@/features/recouvrements/queries/facture.mutation';

interface ReinitialiserFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Le geste efface un recouvrement entier : la fenetre est marquee `destructif`, et c'est
 * le bouton d'action qui prend le rouge. Il etait peint a la main en `bg-destructive`,
 * un jeton herite de shadcn, pendant que « Annuler » restait neutre a cote.
 */
export const ReinitialiserFactureDialog = ({ facture, open, onOpenChange }: ReinitialiserFactureDialogProps) => {
  const { mutate: reinitialiserFacture, isPending: isLoading } = useReinitialiserFactureMutation();

  const handleReset = () => {
    reinitialiserFacture(facture.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <FenetreAction
      destructif
      enAttente={isLoading}
      libelleAction="Réinitialiser"
      onAction={handleReset}
      onFermer={() => onOpenChange(false)}
      ouvert={open}
      titre="Réinitialiser la facture ?"
    >
      <p className="text-sm text-foreground">
        Tout le recouvrement de la facture <strong>{facture.code}</strong> du restaurant{' '}
        <strong>{facture.restaurantName}</strong> sera annulé. La facture repart à l’étape{' '}
        <strong>« validée, non payée »</strong>.
      </p>

      <div className="space-y-1 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm">
        <p className="font-medium text-danger-soft-foreground">Cette action supprime définitivement :</p>
        <ul className="list-disc pl-5 text-muted">
          <li>tous les recouvrements (encaissements) enregistrés sur cette facture ;</li>
          <li>les dépôts, le visa DGA, l’orientation des fonds, le bordereau et les preuves.</li>
        </ul>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border border-separator bg-surface-secondary p-3 text-sm">
        <span className="text-muted">Montant à recouvrer de nouveau</span>
        <span className="text-right font-semibold tabular-nums">{formatCFA(facture.montant || 0)}</span>
      </div>

      <p className="text-xs text-muted">
        Action irréversible. Le comptable devra reprendre le recouvrement depuis le début.
      </p>
    </FenetreAction>
  );
};
