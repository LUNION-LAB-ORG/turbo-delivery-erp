'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { validateDeliveryMan } from '@/src/actions/delivery-men.actions';
import { DeliveryMan } from '@/types/models';

const DeliveryMenValidate = ({
  deliveryMan,
  open,
  setOpen,
  validateBy = 'no-body',
}: {
  deliveryMan: DeliveryMan;
  open: boolean;
  setOpen: (open: boolean) => void;
  validateBy: 'auth' | 'no-body' | 'ops';
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

  const handleSubmit = async () => {
    const result = await validateDeliveryMan(deliveryMan.id, validateBy);
    if (result.status === 'success') {
      toast.success(result.message || 'Bravo ! vous avez réussi');
      router.refresh();
      setOpen(false);
    } else {
      toast.error(result.message || "Erreur lors de l'envoi de l'email");
    }
    return result;
  };

  const nom = `${deliveryMan.prenoms ?? ''} ${deliveryMan.nom ?? ''}`.trim();

  return (
    <FenetreAction
      enAttente={pending}
      libelleAction="Valider"
      onAction={() => {
        if (pending) return;
        setPending(true);
        void handleSubmit().finally(() => setPending(false));
      }}
      onFermer={() => setOpen(false)}
      ouvert={open}
      /* Le titre annoncait « Valider l'ETABLISSEMENT » sur la fenetre qui valide un
         LIVREUR — un copier-coller depuis l'ecran des partenaires. */
      titre={nom ? `Valider ${nom}` : 'Valider le livreur'}
    >
      <p className="text-sm text-muted">
        Le livreur passera au statut validé et pourra être assigné à un site partenaire.
      </p>
    </FenetreAction>
  );
};

export default DeliveryMenValidate;
