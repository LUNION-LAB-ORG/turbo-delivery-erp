'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@heroui-v3/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  CategorieDepenseCreateDTO,
  CategorieDepenseCreateSchema,
} from '@/features/depenses/schemas/categorie-depense.schema';

import { useAjouterCategorieDepenseMutation } from '../../queries/category/categorie-depense-mutation.query';

/**
 * La creation d'une categorie de depense.
 *
 * <h3>Ce qui change</h3>
 * <p>Le bouton d'ouverture etait peint `bg-amber-500 hover:bg-amber-600 text-white`, une
 * couleur ecrite en dur qui n'existe nulle part ailleurs dans l'ERP et qui n'a pas de
 * variante sombre. C'est le bouton d'action de la bibliotheque.</p>
 *
 * <p>L'echec de la mutation n'etait ecrit que dans la console : la fenetre restait ouverte
 * sans un mot et l'operateur recommencait. Il est dit.</p>
 */
export function CreerCategorieModal() {
  const [ouvert, setOuvert] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<CategorieDepenseCreateDTO>({
    resolver: zodResolver(CategorieDepenseCreateSchema),
    defaultValues: {
      description: '',
      nomCategorie: '',
    },
  });

  const ajouterCategorie = useAjouterCategorieDepenseMutation();

  const fermer = () => {
    reset();
    setOuvert(false);
  };

  const onSubmit = async (data: CategorieDepenseCreateDTO) => {
    try {
      await ajouterCategorie.mutateAsync({
        description: data.description,
        nomCategorie: data.nomCategorie,
      });

      fermer();

      toast.success('Catégorie créée avec succès', {
        description: `La catégorie "${data.nomCategorie}" a été ajoutée avec succès`,
        duration: 4000,
      });
    } catch (error) {
      toast.error("La catégorie n'a pas été créée", {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    }
  };

  const soumettre = handleSubmit(onSubmit);
  const enAttente = isSubmitting || ajouterCategorie.isPending;

  return (
    <>
      <Button onPress={() => setOuvert(true)} variant="primary">
        <Plus aria-hidden="true" className="size-4" />
        Ajouter<span className="hidden md:inline">&nbsp;une catégorie</span>
      </Button>

      <FenetreAction
        enAttente={enAttente}
        libelleAction={enAttente ? 'Création en cours…' : 'Ajouter'}
        onAction={() => void soumettre()}
        onFermer={fermer}
        ouvert={ouvert}
        titre="Ajouter une catégorie"
      >
        {/*
         * Le bouton d'action vit dans le pied de la fenetre, hors du formulaire. Sans
         * bouton d'envoi par defaut ICI, la touche Entree ne validerait plus la saisie.
         */}
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void soumettre();
          }}
        >
          <Controller
            control={control}
            name="nomCategorie"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.nomCategorie?.message}
                label="Nom"
                onChange={field.onChange}
                placeholder="Nom de la catégorie"
                valeur={field.value ?? ''}
              />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <ChampTexte
                erreur={errors.description?.message}
                label="Description"
                onChange={field.onChange}
                placeholder="Description"
                valeur={field.value ?? ''}
              />
            )}
          />
          <button aria-hidden="true" className="hidden" tabIndex={-1} type="submit" />
        </form>
      </FenetreAction>
    </>
  );
}
