'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { useInvalidatePriceListQuery } from '@/features/price-list/queries/price-list.query';
import { deletePriceList } from '@/src/price-list/price-list.action';

const PriceListeDelete = ({
  id,
  open,
  setOpen,
}: {
  id: string;
  open: boolean;
  setOpen: (open: boolean) => void;
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
  const invalidatePriceList = useInvalidatePriceListQuery();

  const handleSubmit = async () => {
    const result = await deletePriceList(id);
    if (result.status === 'success') {
      toast.success(result.message || 'Bravo ! vous avez réussi');
      setOpen(false);
      await invalidatePriceList();
    } else {
      toast.error(result.message || "Erreur lors de l'envoi de l'email");
      setOpen(false);
    }
    return result;
  };

  return (
    <FenetreAction
      destructif
      enAttente={pending}
      libelleAction="Supprimer"
      onAction={() => {
        if (pending) return;
        setPending(true);
        void handleSubmit().finally(() => setPending(false));
      }}
      onFermer={() => setOpen(false)}
      ouvert={open}
      titre="Supprimer ce frais de livraison"
    >
      <p className="text-sm text-muted">
        La zone et son tarif disparaîtront de la grille du partenaire. Les courses déjà
        facturées gardent le tarif qui leur a été appliqué.
      </p>
    </FenetreAction>
  );
};

export default PriceListeDelete;
