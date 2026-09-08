'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useSupprimerInvestissementMutation } from '@/features/revenus/queries/investissement/investissement.mutation';
import { IInvestissement } from '@/features/revenus/types/revenus.types';
import { formatCFA, formatDateFR } from '@/src/actions/bonLivraison.mapper';

type Props = {
  investissement: IInvestissement | null;
  onFermer: () => void;
  ouvert: boolean;
};

export default function SupprimerInvestissementModal({ investissement, onFermer, ouvert }: Props) {
  const { isPending, mutate: supprimerInvestissementMutation } =
    useSupprimerInvestissementMutation();

  const handleDelete = useCallback(() => {
    if (!investissement) {
      toast.error('Investissement introuvable.');
      return;
    }
    supprimerInvestissementMutation(investissement.id, {
      onError: () => {
        toast.error("Erreur lors de la suppression de l'investissement.");
      },
      onSuccess: () => {
        toast.success('Investissement supprimé avec succès.');
        onFermer();
      },
    });
  }, [investissement, onFermer, supprimerInvestissementMutation]);

  return (
    <FenetreAction
      destructif
      enAttente={isPending}
      libelleAction="Supprimer"
      onAction={handleDelete}
      onFermer={onFermer}
      ouvert={ouvert}
      titre={`Supprimer l'investissement de ${investissement?.nomInvestisseur ?? ''} ?`}
    >
      {/*
       * La fenetre demandait de confirmer sans jamais dire CE QU'ELLE ALLAIT DETRUIRE :
       * seul le nom figurait dans le titre. Sur une liste ou un meme investisseur revient
       * plusieurs fois, rien ne distinguait la ligne visee d'une autre. Le montant et
       * l'echeance sont maintenant rappeles.
       */}
      {investissement && (
        <dl className="flex flex-col gap-1.5 rounded-lg border border-separator bg-surface-secondary p-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">Montant du prêt</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {formatCFA(investissement.montant)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">Échéance</dt>
            <dd className="tabular-nums text-foreground">{formatDateFR(investissement.deadline)}</dd>
          </div>
        </dl>
      )}
      <p className="text-sm text-foreground">
        Êtes-vous sûr de vouloir supprimer cet investissement ?{' '}
        <strong className="font-semibold text-danger-soft-foreground">
          Cette action est irréversible.
        </strong>
      </p>
    </FenetreAction>
  );
}
