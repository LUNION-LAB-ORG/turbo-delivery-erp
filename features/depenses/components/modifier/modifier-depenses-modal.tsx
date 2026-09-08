'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Tooltip } from '@heroui-v3/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { DepenseUpdateDTO, DepenseUpdateSchema } from '@/features/depenses/schemas/depense.schema';
import { IDepense } from '@/features/depenses/types/depense.type';
import { useInvestissementList } from '@/features/revenus/hooks/use-investissement-list';

import { useCategorieDepensesListQuery } from '../../queries/category/categorie-depense.query';
import { useModifierDepenseMutation } from '../../queries/depense.mutation';
import { DepenseForm } from '../common/depense-form';

const valeursDeLaLigne = (d: IDepense): DepenseUpdateDTO => ({
  categorieDepense: d.categorie?.id ?? '',
  dateDepense: d.dateDepense ? new Date(d.dateDepense) : new Date(),
  description: d.description ?? '',
  investissementId: d.investissement?.id ?? '',
  montant: d.montant,
  sourcePaiement: d.sourcePaiement ?? '',
  statut: d.statut ?? 'PENDING',
  typeDepense: d.typeDepense ?? null,
});

/**
 * La fenetre elle-meme.
 *
 * <h3>Ce qui change</h3>
 * <p>Le statut de la depense s'ouvrait TOUJOURS sur « En attente », quel que soit le
 * statut reel : le champ etait pilote par un etat local qui ne recevait jamais la valeur
 * de la ligne. Une depense deja payee se rouvrait donc en attente, et le simple fait de
 * corriger une virgule la renvoyait au statut faux. Le formulaire part du statut
 * enregistre.</p>
 *
 * <p>Meme chose pour l'investissement rattache : il s'affichait dans la liste mais
 * n'entrait pas dans les valeurs du formulaire, si bien qu'une modification qui n'y
 * touchait pas pouvait le perdre.</p>
 */
function FenetreModification({ depense, onFermer }: { depense: IDepense; onFermer: () => void }) {
  const [estRecurrente, setEstRecurrente] = useState<boolean>(Boolean(depense.typeDepense));

  const { data: categories, isLoading: categoriesLoading } = useCategorieDepensesListQuery({});
  const { investissements, isLoading: investissementsLoading } = useInvestissementList();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<DepenseUpdateDTO>({
    resolver: zodResolver(DepenseUpdateSchema),
    defaultValues: valeursDeLaLigne(depense),
  });

  const modifierDepense = useModifierDepenseMutation();

  const onSubmit = async (data: DepenseUpdateDTO) => {
    try {
      await modifierDepense.mutateAsync({
        data: {
          ...data,
          periodicite: estRecurrente ? data.periodicite : null,
          typeDepense: estRecurrente ? data.typeDepense : null,
        },
        id: depense.id,
      });

      toast.success('Dépense modifiée avec succès', { duration: 4000 });
      onFermer();
    } catch (error) {
      toast.error('Erreur lors de la modification', {
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        duration: 4000,
      });
    }
  };

  const soumettre = handleSubmit(onSubmit);
  const enAttente = isSubmitting || modifierDepense.isPending;

  return (
    <FenetreAction
      enAttente={enAttente}
      libelleAction={enAttente ? 'Modification…' : 'Modifier'}
      onAction={() => void soumettre()}
      onFermer={onFermer}
      ouvert
      titre="Modifier la dépense"
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
          investissements={investissements}
          investissementsLoading={investissementsLoading}
          onEstRecurrenteChange={setEstRecurrente}
        />
        <button aria-hidden="true" className="hidden" tabIndex={-1} type="submit" />
      </form>
    </FenetreAction>
  );
}

/**
 * Le geste « modifier » d'une ligne de depense.
 *
 * <p>Le declencheur etait un `&lt;button&gt;` nu portant un crayon ORANGE et un libelle
 * cache sous `md`, donc, sur telephone, une icone sans nom accessible. C'est un bouton de
 * la bibliotheque, avec son etat de focus, sa taille de cible et son infobulle.</p>
 *
 * <p>La fenetre ne se monte qu'a l'ouverture. Elle vit dans CHAQUE ligne du tableau :
 * montee d'office, son resolveur, ses valeurs par defaut et ses deux listes de reference
 * seraient instancies dix fois par page pour un geste qu'on ne fait qu'une fois.</p>
 */
export function ModifierDepenseModal({ depense }: { depense: IDepense }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Tooltip>
        <Button
          aria-label={`Modifier la dépense ${depense.description || ''}`.trim()}
          isIconOnly
          onPress={() => setOuvert(true)}
          size="sm"
          variant="ghost"
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>Modifier</Tooltip.Content>
      </Tooltip>

      {ouvert && <FenetreModification depense={depense} onFermer={() => setOuvert(false)} />}
    </>
  );
}
