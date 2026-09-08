'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@heroui-v3/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { DepenseCreateDTO, DepenseCreateSchema } from '@/features/depenses/schemas/depense.schema';
import { useInvestissementListQuery } from '@/features/revenus/queries/investissement/investissement-list.query';

import { useCategorieDepensesListQuery } from '../../queries/category/categorie-depense.query';
import { useAjouterDepenseMutation } from '../../queries/depense.mutation';
import { DepenseForm } from '../common/depense-form';

/**
 * L'enregistrement d'une depense.
 *
 * <h3>Ce qui change</h3>
 * <p>La date de comptabilisation vivait DEUX fois : dans un etat local du composant et
 * dans le formulaire. Les deux pouvaient diverger, et c'est l'etat local qui gagnait a
 * l'envoi, si bien que la validation portait sur une valeur qui n'etait pas celle
 * envoyee. Il
 * n'y a plus qu'une date, celle du formulaire.</p>
 *
 * <p>L'envoi recopiait aussi la totalite du formulaire dans la console du navigateur,
 * montant et libelle compris, a chaque enregistrement. Une console de production n'est pas
 * un journal.</p>
 *
 * <p>Enfin, l'echec de la mutation n'etait ecrit que dans cette meme console : l'operateur
 * voyait la fenetre rester ouverte sans un mot. Il est dit.</p>
 */
export function CreerDepenseModal() {
  const [ouvert, setOuvert] = useState(false);
  const [estRecurrente, setEstRecurrente] = useState(false);

  const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({});
  const { data: investissementsData, isLoading: investissementsLoading } =
    useInvestissementListQuery({});

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<DepenseCreateDTO>({
    resolver: zodResolver(DepenseCreateSchema),
    defaultValues: {
      categorieDepense: '',
      dateDepense: new Date(),
      description: '',
      investissementId: '',
      montant: 0,
      periodicite: null,
      sourcePaiement: '',
      statut: 'PENDING',
      typeDepense: null,
    },
  });

  const { isPending, mutate: ajouterDepense } = useAjouterDepenseMutation();

  const fermer = () => {
    reset();
    setEstRecurrente(false);
    setOuvert(false);
  };

  const onSubmit = (data: DepenseCreateDTO) => {
    ajouterDepense(
      {
        ...data,
        periodicite: estRecurrente ? data.periodicite : null,
        statut: data.statut || 'PENDING',
        typeDepense: estRecurrente ? data.typeDepense : null,
      },
      {
        onError: (error) => {
          toast.error("La dépense n'a pas été enregistrée", {
            description: error instanceof Error ? error.message : 'Une erreur est survenue',
          });
        },
        onSuccess: () => {
          toast.success('Dépense enregistrée');
          fermer();
        },
      },
    );
  };

  const soumettre = handleSubmit(onSubmit);

  return (
    <>
      {/* Sous `md` il ne reste que le signe plus : sans nom accessible, le bouton
          s'annoncait « bouton » et rien d'autre. */}
      <Button
        aria-label="Ajouter une dépense"
        onPress={() => setOuvert(true)}
        variant="primary"
      >
        <Plus aria-hidden="true" className="size-4" />
        <span className="hidden md:inline">Ajouter une dépense</span>
      </Button>

      <FenetreAction
        enAttente={isSubmitting || isPending}
        libelleAction={isSubmitting || isPending ? 'Enregistrement…' : 'Ajouter'}
        onAction={() => void soumettre()}
        onFermer={fermer}
        ouvert={ouvert}
        titre="Ajouter une dépense"
      >
        {/*
         * Le bouton d'action vit dans le pied de la fenetre, hors du formulaire. Sans
         * bouton d'envoi par defaut ICI, la touche Entree ne validerait plus la saisie.
         */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void soumettre();
          }}
        >
          <DepenseForm
            categories={categories}
            categoriesLoading={categoriesLoading}
            control={control}
            errors={errors}
            estRecurrente={estRecurrente}
            investissements={investissementsData?.content || []}
            investissementsLoading={investissementsLoading}
            onEstRecurrenteChange={setEstRecurrente}
          />
          <button aria-hidden="true" className="hidden" tabIndex={-1} type="submit" />
        </form>
      </FenetreAction>
    </>
  );
}
