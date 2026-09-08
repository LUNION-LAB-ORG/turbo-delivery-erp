'use client';

import { Button, Tooltip } from '@heroui-v3/react';
import { Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { formatMontant } from '@/utils/format.utils';

import { useSupprimerCategorieDepenseMutation } from '../../queries/category/categorie-depense-mutation.query';

type Props = {
  categorieDepense: ICategorieDepense | null;
};

/**
 * La suppression d'une categorie, et de tout ce qu'elle contient.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenetre restait OUVERTE apres la suppression : la ligne disparaissait derriere
 * elle, et il fallait fermer a la main pour s'en apercevoir. Elle se ferme quand c'est
 * fait, et reste ouverte quand cela echoue, pour qu'on puisse reessayer.</p>
 *
 * <p>Le declencheur etait un `&lt;button&gt;` nu portant une corbeille peinte
 * `text-red-500`, avec son libelle cache sous `md` : sur telephone, une icone rouge sans
 * nom accessible. Le geste detruit, donc le rouge a sa place, mais celui du theme.</p>
 *
 * <p>L'avertissement, qui dit que la suppression emporte toutes les depenses de la
 * categorie, etait un `&lt;strong&gt;` rouge au milieu d'un paragraphe. C'est pourtant la
 * seule chose a lire ici :
 * il est dans un encart, et le montant que ces depenses representent y est dit, parce
 * qu'une categorie a 340 000 FCFA ne se supprime pas comme une categorie vide.</p>
 */
export default function SupprimerCategorieModal({ categorieDepense }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const { isPending, mutate: supprimerCategorie } = useSupprimerCategorieDepenseMutation();

  // La mutation dit deja la reussite et l'echec : un second message ici en affichait
  // DEUX, mot pour mot, pour une seule suppression.
  const supprimer = useCallback(() => {
    if (!categorieDepense?.id) {
      toast.error('Catégorie introuvable');
      return;
    }

    supprimerCategorie(categorieDepense.id, {
      onSuccess: () => setOuvert(false),
    });
  }, [categorieDepense, supprimerCategorie]);

  return (
    <>
      <Tooltip>
        <Button
          aria-label={`Supprimer la catégorie ${categorieDepense?.nomCategorie ?? ''}`.trim()}
          isIconOnly
          onPress={() => setOuvert(true)}
          size="sm"
          variant="danger-soft"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>Supprimer</Tooltip.Content>
      </Tooltip>

      <FenetreAction
        destructif
        enAttente={isPending}
        libelleAction={isPending ? 'Suppression…' : 'Supprimer'}
        onAction={supprimer}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre={`Supprimer ${categorieDepense?.nomCategorie ?? 'la catégorie'} ?`}
      >
        <p className="text-sm text-muted">
          Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
        </p>

        <div className="rounded-lg border border-danger/25 bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          Toutes les dépenses rattachées à cette catégorie seront supprimées en même temps.
          {typeof categorieDepense?.totalDepense === 'number' && (
            <>
              {' '}
              Elles totalisent{' '}
              <span className="font-semibold tabular-nums">
                {formatMontant(categorieDepense.totalDepense)}
              </span>
              .
            </>
          )}
        </div>
      </FenetreAction>
    </>
  );
}
