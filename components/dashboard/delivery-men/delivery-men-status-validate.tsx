'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { validateDeliveryMan } from '@/src/actions/delivery-men.actions';
import { LivreurStatutVM } from '@/types/models';

const DeliveryMenStatusValidate = ({
  deliveryMan,
  onSuccess,
  open,
  setOpen,
  validateBy = 'no-body',
}: {
  deliveryMan: LivreurStatutVM;
  onSuccess?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  validateBy: 'auth' | 'no-body' | 'ops';
}) => {
  /*
   * `useFormStatus()` renvoyait toujours `pending: false` ici.
   *
   * Ce hook ne lit l'etat que d'un `<form>` ANCESTRAL, et depuis un composant
   * ENFANT de ce formulaire. Appele dans une modale qui n'en contient aucun, il ne
   * peut rien observer : le bouton restait actif pendant l'attente, sans indicateur,
   * et rien n'empechait un second clic — sur « valider un livreur », cela declenche
   * l'action deux fois.
   */
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const valide = validateBy === 'auth';

  const handleSubmit = async () => {
    const result = await validateDeliveryMan(deliveryMan.livreurId ?? '', validateBy);
    if (result.status === 'success') {
      toast.success(result.message || 'Bravo ! vous avez réussi');
      router.refresh();
      onSuccess?.();
    } else {
      toast.error(result.message || "Erreur lors de l'envoi de l'email");
    }
    setOpen(false);
    return result;
  };

  return (
    <FenetreAction
      enAttente={pending}
      libelleAction={valide ? 'Valider' : 'Activer'}
      onAction={() => {
        if (pending) return;
        setPending(true);
        void handleSubmit().finally(() => setPending(false));
      }}
      onFermer={() => setOpen(false)}
      ouvert={open}
      titre={`${valide ? 'Valider' : 'Activer'} ${deliveryMan.nomPrenom ?? 'le livreur'}`}
    >
      <p className="text-sm text-muted">
        {valide
          ? 'Le livreur passera au statut validé et pourra être assigné à un site partenaire.'
          : 'Le livreur pourra de nouveau recevoir des courses.'}
      </p>
    </FenetreAction>
  );
};

export default DeliveryMenStatusValidate;
