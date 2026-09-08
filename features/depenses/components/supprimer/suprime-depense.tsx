'use client';

import { Button, Tooltip } from '@heroui-v3/react';
import { Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { IDepense } from '@/features/depenses/types/depense.type';

import { useSupprimerDepenseMutation } from '../../queries/depense.mutation';

/**
 * La suppression d'une depense.
 *
 * <h3>Ce qui change</h3>
 * <p>Le declencheur etait un `&lt;button&gt;` nu portant une corbeille ROUGE ecrite en dur
 * et un libelle cache sous `md` : sur telephone, une icone rouge sans nom accessible. Le
 * geste est destructif, donc le rouge a sa place, mais celui de la bibliotheque, qui
 * suit le theme sombre.</p>
 *
 * <p>La fenetre restait OUVERTE apres la suppression : la ligne disparaissait derriere
 * elle et il fallait fermer a la main pour s'en apercevoir. Elle se ferme, et l'echec la
 * laisse ouverte pour qu'on puisse reessayer.</p>
 */
export default function SupprimerDepenseModal({ depense }: { depense: IDepense | null }) {
  const [ouvert, setOuvert] = useState(false);
  const { isPending, mutate: supprimerDepense } = useSupprimerDepenseMutation();

  const supprimer = useCallback(() => {
    if (!depense?.id) {
      toast.error('Dépense non trouvée');
      return;
    }

    supprimerDepense(depense.id, {
      onError: (error) => {
        toast.error('Erreur lors de la suppression de la dépense', {
          description: error instanceof Error ? error.message : 'Une erreur est survenue',
        });
      },
      onSuccess: () => {
        setOuvert(false);
        toast.success('Dépense supprimée avec succès');
      },
    });
  }, [depense, supprimerDepense]);

  return (
    <>
      <Tooltip>
        <Button
          aria-label={`Supprimer la dépense ${depense?.description || ''}`.trim()}
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
        titre={`Supprimer ${depense?.description || 'la dépense'} ?`}
      >
        <p className="text-sm text-muted">
          Êtes-vous sûr de vouloir supprimer cette dépense ? Cette action est irréversible.
        </p>
      </FenetreAction>
    </>
  );
}
