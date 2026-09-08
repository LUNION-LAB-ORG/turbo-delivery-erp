'use client';

import { Button } from '@heroui-v3/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useSupprimerEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';
import type { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';

interface SupprimerEntreeCaisseModalProps {
  entreeCaisse: IEntreeCaisse;
}

/**
 * La suppression d'une entree de caisse.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un `AlertDialog` de shadcn (une quatrieme bibliotheque de fenetres a cote de
 * celle de la v3) dont le bouton de confirmation etait repeint `bg-red-500` par-dessus sa
 * propre variante. La corbeille d'ouverture, elle, etait un bouton SANS nom accessible,
 * repete a chaque ligne du tableau.</p>
 *
 * <p>La fenetre ne se fermait pas quand la suppression aboutissait : `AlertDialogAction`
 * fermait le dialogue AVANT que la mutation ne reponde, si bien que l'etat « Suppression…
 * » n'etait jamais visible et qu'un echec ne se voyait nulle part. La fenetre reste
 * ouverte le temps de la reponse, et ne se ferme que sur un succes.</p>
 */
export function SupprimerEntreeCaisseModal({ entreeCaisse }: SupprimerEntreeCaisseModalProps) {
  const [open, setOpen] = useState(false);
  const mutation = useSupprimerEntreeCaisseMutation();

  return (
    <>
      <Button
        aria-label={`Supprimer l'entrée ${entreeCaisse.libelle}`}
        isIconOnly
        onPress={() => setOpen(true)}
        size="sm"
        variant="ghost"
      >
        <Trash2 aria-hidden="true" className="size-4 text-danger" />
      </Button>

      <FenetreAction
        destructif
        enAttente={mutation.isPending}
        libelleAction={mutation.isPending ? 'Suppression…' : 'Supprimer'}
        onAction={() =>
          mutation.mutate(entreeCaisse.id, { onSuccess: () => setOpen(false) })
        }
        onFermer={() => setOpen(false)}
        ouvert={open}
        titre="Supprimer l'entrée caisse"
      >
        <p className="text-sm text-muted">
          Supprimer «&nbsp;{entreeCaisse.libelle}&nbsp;» ? Cette action est irréversible.
        </p>
      </FenetreAction>
    </>
  );
}
