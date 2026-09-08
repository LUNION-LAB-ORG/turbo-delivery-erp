'use client';

import { Button } from '@heroui-v3/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useAjouterInvestissementMutation } from '@/features/revenus/queries/investissement/investissement.mutation';
import {
  InvestissementCreateDTO,
  InvestissementCreateSchema,
} from '@/features/revenus/schemas/investissement.schema';

import { InvestissementForm } from '../investissement-form';

export function AddInvestModal() {
  const [open, setOpen] = useState(false);

  const form = useForm<InvestissementCreateDTO>({
    resolver: zodResolver(InvestissementCreateSchema),
    defaultValues: {
      dateInvestissement: '',
      deadline: '',
      montant: 0,
      nomInvestisseur: '',
    },
  });

  const { handleSubmit, reset } = form;

  const ajouterInvestissementMutation = useAjouterInvestissementMutation();
  const enAttente = form.formState.isSubmitting || ajouterInvestissementMutation.isPending;

  const fermer = () => {
    reset();
    setOpen(false);
  };

  const onSubmit = (data: InvestissementCreateDTO) => {
    ajouterInvestissementMutation.mutate(data, {
      onSuccess: () => {
        fermer();
        toast.success('Investissement créé avec succès !');
      },
    });
  };

  return (
    <>
      {/*
       * Sous 768 px le libelle est masque et il ne reste que le signe « + » : le bouton
       * n'avait alors PLUS AUCUN nom, ni a l'ecran ni pour un lecteur d'ecran. Le nom
       * accessible est desormais porte par le bouton lui-meme, quelle que soit la largeur.
       */}
      <Button aria-label="Ajouter un investissement" onPress={() => setOpen(true)} variant="secondary">
        <Plus aria-hidden="true" className="size-4" />
        <span className="hidden md:inline">Ajouter Investissement</span>
      </Button>

      <FenetreAction
        enAttente={enAttente}
        libelleAction="Ajouter"
        onAction={handleSubmit(onSubmit)}
        onFermer={fermer}
        ouvert={open}
        titre="Ajouter un investissement"
      >
        <InvestissementForm form={form} />
      </FenetreAction>
    </>
  );
}
