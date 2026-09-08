'use client';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { IFacture } from '@/features/recouvrements/types/facture.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useRecalculerFactureMutation } from '@/features/recouvrements/queries/facture.mutation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RecalculerFactureDialogProps {
  facture: IFacture;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (value?: string) => {
  if (!value) return '—';
  try {
    return format(new Date(value), 'dd MMM yyyy', { locale: fr });
  } catch {
    return value;
  }
};

/**
 * Le recalcul n'est PAS destructif : la fenetre garde donc l'accent, pas le danger.
 *
 * <p>L'`AlertDialog` de shadcn portait un `AlertDialogDescription asChild` autour d'un
 * `<div>` : une description de dialogue qui contient un bloc, une liste et un tableau de
 * montants n'est plus une description, et les lecteurs d'ecran la lisaient d'une traite
 * comme le texte de la fenetre. Le contenu est ici le CORPS de la fenetre.</p>
 */
export const RecalculerFactureDialog = ({ facture, open, onOpenChange }: RecalculerFactureDialogProps) => {
  const { mutate: recalculerFacture, isPending: isLoading } = useRecalculerFactureMutation();

  const handleRecalculate = () => {
    recalculerFacture(facture.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <FenetreAction
      enAttente={isLoading}
      libelleAction="Recalculer"
      onAction={handleRecalculate}
      onFermer={() => onOpenChange(false)}
      ouvert={open}
      titre="Recalculer la facture"
    >
      <p className="text-sm text-foreground">
        Le montant de la facture du restaurant <strong>{facture.restaurantName}</strong> sera
        recalculé à partir des courses actuelles, <strong>sur la même période</strong> :
      </p>

      <div className="rounded-md border border-separator bg-surface-secondary p-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Période</span>
          <span className="text-right font-medium tabular-nums">
            {formatDate(facture.periodeDebut)} → {formatDate(facture.periodeFin)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4">
          <span className="text-muted">Montant actuel</span>
          <span className="text-right font-semibold tabular-nums">{formatCFA(facture.montant || 0)}</span>
        </div>
      </div>

      <p className="text-xs text-muted">
        Utile si la facture avait été établie sur des données erronées. Le déjà-recouvré est
        conservé : seul le montant restant à payer est ajusté.
      </p>
    </FenetreAction>
  );
};
