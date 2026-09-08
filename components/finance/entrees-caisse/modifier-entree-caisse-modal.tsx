'use client';

import { Button } from '@heroui-v3/react';
import { Pencil } from 'lucide-react';
import { useRef, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useModifierEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';
import type { EntreeCaisseCreateDTO } from '@/features/entrees-caisse/schemas/entree-caisse.schema';
import type { IEntreeCaisse } from '@/features/entrees-caisse/types/entree-caisse.types';

import { EntreeCaisseForm } from './entree-caisse-form';

interface ModifierEntreeCaisseModalProps {
  entreeCaisse: IEntreeCaisse;
}

/**
 * La modification d'une entree de caisse.
 *
 * <h3>Ce qui change</h3>
 * <p>Le bouton d'ouverture etait un crayon SEUL, sans nom accessible : dans un tableau de
 * dix lignes, un lecteur d'ecran annoncait dix boutons identiques et sans libelle. Il
 * porte maintenant le libelle de l'entree qu'il modifie.</p>
 */
export function ModifierEntreeCaisseModal({ entreeCaisse }: ModifierEntreeCaisseModalProps) {
  const [open, setOpen] = useState(false);
  const mutation = useModifierEntreeCaisseMutation();
  // Le pied de page appartient a la fenetre : le formulaire y depose sa soumission.
  const soumission = useRef<(() => void) | null>(null);

  const onSubmit = async (data: EntreeCaisseCreateDTO) => {
    await mutation.mutateAsync({ data, id: entreeCaisse.id });
    setOpen(false);
  };

  return (
    <>
      <Button
        aria-label={`Modifier l'entrée ${entreeCaisse.libelle}`}
        isIconOnly
        onPress={() => setOpen(true)}
        size="sm"
        variant="ghost"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </Button>

      <FenetreAction
        enAttente={mutation.isPending}
        libelleAction="Modifier"
        onAction={() => soumission.current?.()}
        onFermer={() => setOpen(false)}
        ouvert={open}
        titre="Modifier l'entrée caisse"
      >
        <EntreeCaisseForm
          defaultValues={{
            commentaire: entreeCaisse.commentaire,
            dateEntree: entreeCaisse.dateEntree,
            libelle: entreeCaisse.libelle,
            montant: entreeCaisse.montant,
            paye: entreeCaisse.paye,
          }}
          onSubmit={onSubmit}
          soumission={soumission}
        />
      </FenetreAction>
    </>
  );
}
