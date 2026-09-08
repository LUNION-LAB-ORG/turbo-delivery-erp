'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useModifierInvestissementMutation } from '@/features/revenus/queries/investissement/investissement.mutation';
import {
  InvestissementUpdateDTO,
  InvestissementUpdateSchema,
} from '@/features/revenus/schemas/investissement.schema';
import { IInvestissement } from '@/features/revenus/types/revenus.types';

import { InvestissementForm } from '../investissement-form';

interface ModifierInvestModalProps {
  investissement: IInvestissement;
  onFermer: () => void;
  ouvert: boolean;
}

/**
 * <p>La fenetre portait son propre declencheur, un `<button>` nu place DANS un element de
 * menu : un element interactif dans un autre element interactif, dont le comportement
 * n'est pas defini. Elle est maintenant pilotee par la ligne, qui sait quel geste a ete
 * choisi dans le menu.</p>
 */
export function ModifierInvestModal({ investissement, onFermer, ouvert }: ModifierInvestModalProps) {
  const form = useForm<InvestissementUpdateDTO>({
    resolver: zodResolver(InvestissementUpdateSchema),
    defaultValues: {
      dateInvestissement: investissement.dateInvestissement,
      deadline: investissement.deadline,
      montant: investissement.montant,
      nomInvestisseur: investissement.nomInvestisseur,
    },
  });

  const { handleSubmit, reset } = form;

  // La fenetre n'est plus demontee entre deux ouvertures : sans cette remise a l'etat de
  // la ligne, on rouvrirait sur la saisie abandonnee la fois precedente.
  useEffect(() => {
    if (!ouvert) return;
    reset({
      dateInvestissement: investissement.dateInvestissement,
      deadline: investissement.deadline,
      montant: investissement.montant,
      nomInvestisseur: investissement.nomInvestisseur,
    });
  }, [investissement, ouvert, reset]);

  const modifierInvestissementMutation = useModifierInvestissementMutation();
  const enAttente = form.formState.isSubmitting || modifierInvestissementMutation.isPending;

  const onSubmit = (data: InvestissementUpdateDTO) => {
    modifierInvestissementMutation.mutate(
      { data, id: investissement.id },
      {
        onError: () => {
          toast.error('Erreur lors de la modification', {
            description: "Une erreur s'est produite lors de la modification",
            duration: 4000,
          });
        },
        onSuccess: () => {
          onFermer();
          toast.success('Investissement modifié avec succès', {
            description: `L'investissement de "${data.nomInvestisseur}" a été modifié avec succès`,
            duration: 4000,
          });
        },
      },
    );
  };

  return (
    <FenetreAction
      enAttente={enAttente}
      libelleAction="Modifier"
      onAction={handleSubmit(onSubmit)}
      onFermer={onFermer}
      ouvert={ouvert}
      titre="Modifier un investissement"
    >
      <p className="text-sm text-muted">
        Modifiez les informations de l&apos;investissement de {investissement.nomInvestisseur}
      </p>
      <InvestissementForm form={form} />
    </FenetreAction>
  );
}
