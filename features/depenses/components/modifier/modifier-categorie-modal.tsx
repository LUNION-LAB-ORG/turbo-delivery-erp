'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Tooltip } from '@heroui-v3/react';
import { Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import {
  CategorieDepenseUpdateDTO,
  CategorieDepenseUpdateSchema,
} from '@/features/depenses/schemas/categorie-depense.schema';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';

import { useModifierCategorieDepenseMutation } from '../../queries/category/categorie-depense-mutation.query';

interface ModifierCategorieModalProps {
  categorieDepense: ICategorieDepense;
}

/**
 * La modification d'une categorie de depense.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenetre ne se FERMAIT PAS apres un enregistrement reussi. Elle etait pilotee par
 * un `open` que le composant mettait a `false`, mais le dialogue, lui, n'etait branche sur
 * rien : seule la croix le fermait. L'operateur enregistrait, ne voyait rien bouger, et
 * enregistrait a nouveau.</p>
 *
 * <p>Elle s'intitulait « Modifier un investissement » et son echec parlait de la
 * « modification de l'investissement » : le fichier avait ete recopie depuis un autre
 * module, et un comptable pouvait croire s'etre trompe d'ecran.</p>
 *
 * <p>Le formulaire ne repartait pas non plus des valeurs de la ligne : abandonner une
 * saisie puis rouvrir la fenetre la rendait telle qu'on l'avait laissee. Le bouton
 * d'enregistrement, lui, etait peint `bg-amber-500` en dur, une couleur qui n'existe
 * nulle part ailleurs et n'a pas de variante sombre.</p>
 */
export function ModifierCategorieModal({ categorieDepense }: ModifierCategorieModalProps) {
  const [ouvert, setOuvert] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<CategorieDepenseUpdateDTO>({
    resolver: zodResolver(CategorieDepenseUpdateSchema),
    defaultValues: {
      description: categorieDepense.description ?? '',
      nomCategorie: categorieDepense.nomCategorie,
    },
  });

  // La fenetre vit dans la ligne et n'est jamais demontee : sans cette remise a l'etat
  // enregistre, on rouvrirait sur la saisie abandonnee la fois precedente.
  useEffect(() => {
    if (!ouvert) return;
    reset({
      description: categorieDepense.description ?? '',
      nomCategorie: categorieDepense.nomCategorie,
    });
  }, [categorieDepense, ouvert, reset]);

  const modifierCategorie = useModifierCategorieDepenseMutation();

  // La mutation dit deja la reussite et l'echec. Un second message ici en affichait
  // DEUX pour un seul enregistrement.
  const onSubmit = async (data: CategorieDepenseUpdateDTO) => {
    try {
      await modifierCategorie.mutateAsync({
        data: { description: data.description, nomCategorie: data.nomCategorie },
        id: categorieDepense.id,
      });
      setOuvert(false);
    } catch {
      // L'echec laisse la fenetre ouverte : la saisie est conservee pour reessayer.
    }
  };

  const soumettre = handleSubmit(onSubmit);
  const enAttente = isSubmitting || modifierCategorie.isPending;

  return (
    <>
      <Tooltip>
        <Button
          aria-label={`Modifier la catégorie ${categorieDepense.nomCategorie}`}
          isIconOnly
          onPress={() => setOuvert(true)}
          size="sm"
          variant="ghost"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>Modifier</Tooltip.Content>
      </Tooltip>

      <FenetreAction
        enAttente={enAttente}
        libelleAction={enAttente ? 'Modification…' : 'Modifier'}
        onAction={() => void soumettre()}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre="Modifier la catégorie"
      >
        <p className="text-sm text-muted">
          Modifiez les informations de la catégorie {categorieDepense.nomCategorie}
        </p>

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
