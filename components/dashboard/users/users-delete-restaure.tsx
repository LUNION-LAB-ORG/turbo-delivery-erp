'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { deleteRestaureUser } from '@/src/actions/users.actions';
import { User } from '@/types/models';

const UsersDeleteRestaure = ({
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
   * rien n'empechait un second clic.
   *
   * L'etat est desormais tenu localement, autour de l'appel.
   */
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const restaure = Boolean(user.deleted);

  const handleSubmit = async () => {
    const result = await deleteRestaureUser(user.id, user.deleted);

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
      destructif={!restaure}
      enAttente={pending}
      libelleAction={restaure ? 'Restaurer' : 'Supprimer'}
      onAction={() => {
        if (pending) return;
        setPending(true);
        void handleSubmit().finally(() => setPending(false));
      }}
      onFermer={() => setOpen(false)}
      ouvert={open}
      titre={`${restaure ? 'Restaurer' : 'Supprimer'} ${user.prenoms ?? ''} ${user.nom ?? ''}`.trim()}
    >
      <p className="text-sm text-muted">
        {restaure
          ? 'Ce compte réapparaîtra dans la liste des utilisateurs et pourra de nouveau se connecter.'
          : "Ce compte disparaîtra de la liste et ne pourra plus se connecter. Il reste restaurable : rien n'est effacé en base."}
      </p>
    </FenetreAction>
  );
};

export default UsersDeleteRestaure;
