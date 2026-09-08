'use client';

import { Button } from '@heroui-v3/react';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useCreerEntreeCaisseMutation } from '@/features/entrees-caisse/queries/entree-caisse.mutation';
import type { EntreeCaisseCreateDTO } from '@/features/entrees-caisse/schemas/entree-caisse.schema';

import { EntreeCaisseForm } from './entree-caisse-form';

/**
 * La creation d'une entree de caisse.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un `Dialog` de shadcn ouvert par un `DialogTrigger asChild` enveloppant un
 * bouton peint a la main en `bg-primary hover:bg-primary/90`, soit la couleur du bouton
 * primaire recopiee par-dessus un bouton qui la portait deja.</p>
 */
export function CreerEntreeCaisseModal() {
  const [open, setOpen] = useState(false);
  const mutation = useCreerEntreeCaisseMutation();
  // Le pied de page appartient a la fenetre : le formulaire y depose sa soumission.
  const soumission = useRef<(() => void) | null>(null);

  const onSubmit = async (data: EntreeCaisseCreateDTO) => {
    await mutation.mutateAsync(data);
    setOpen(false);
  };

  return (
    <>
      <Button onPress={() => setOpen(true)} size="sm" variant="primary">
        <Plus aria-hidden="true" className="size-4" />
        Nouvelle entrée
      </Button>

      <FenetreAction
        enAttente={mutation.isPending}
        libelleAction="Créer"
        onAction={() => soumission.current?.()}
        onFermer={() => setOpen(false)}
        ouvert={open}
        titre="Nouvelle entrée caisse"
      >
        <EntreeCaisseForm onSubmit={onSubmit} soumission={soumission} />
      </FenetreAction>
    </>
  );
}
