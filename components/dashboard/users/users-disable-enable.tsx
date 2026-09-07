'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { disableEnableUser } from '@/src/actions/users.actions';
import { User } from '@/types/models';

const UsersDisableEnable = ({
  open,
  setOpen,
  user,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: User;
}) => {
  /*
   * `useFormStatus()` renvoyait toujours `pending: false` ici.
   *
   * Ce hook ne lit l'etat que d'un `<form>` ANCESTRAL, et depuis un composant
   * ENFANT de ce formulaire. Appele dans le composant qui rend le formulaire — ou,
   * pire, dans une modale qui n'en contient aucun — il ne peut rien observer.
   * Consequence : le bouton restait actif pendant l'attente, sans indicateur, et
   * rien n'empechait un second clic. Sur « desactiver un utilisateur » ou
   * « valider un livreur », cela declenche l'action deux fois.
   *
   * L'etat est desormais tenu localement, autour de l'appel.
   */
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const desactive = user.status === 1;

  const handleSubmit = async () => {
    const result = await disableEnableUser(user.id, user.status);

    if (result.status === 'success') {
      toast.success(result.message || 'Bravo ! vous avez réussi');
      router.refresh();
      setOpen(false);
    } else {
      toast.error(result.message || "Erreur lors de l'envoi de l'email");
    }

    return result;
  };

  return (
    <FenetreAction
      // Desactiver un compte le RETIRE de l'ERP : c'est le geste destructif des deux.
      destructif={desactive}
      enAttente={pending}
      libelleAction={desactive ? 'Désactiver' : 'Activer'}
      onAction={() => {
        if (pending) return;
        setPending(true);
        void handleSubmit().finally(() => setPending(false));
      }}
      onFermer={() => setOpen(false)}
      ouvert={open}
      titre={`${desactive ? 'Désactiver' : 'Activer'} ${user.prenoms ?? ''} ${user.nom ?? ''}`.trim()}
    >
      <p className="text-sm text-muted">
        {desactive
          ? "Ce compte ne pourra plus se connecter à l'ERP. Ses données et son historique sont conservés, et il peut être réactivé à tout moment."
          : 'Ce compte pourra de nouveau se connecter avec ses identifiants habituels.'}
      </p>
    </FenetreAction>
  );
};

export default UsersDisableEnable;
