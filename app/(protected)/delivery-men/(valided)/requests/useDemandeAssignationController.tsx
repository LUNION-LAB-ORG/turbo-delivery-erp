'use client';

import { useOuverture } from '@/hooks/use-ouverture';
import useConfirm from '@/components/commons/use-confirm-dialog';
import { rejeterDemandeAssignations, validerDemandeAssignations } from '@/src/actions/delivery-men.actions';
import { DemandeAssignationVM } from '@/types/models';
import { Chip } from '@heroui-v3/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function useDemandeAssignationController(demandeAssignations: DemandeAssignationVM[]) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useOuverture();
  const confirm = useConfirm();
  const [data, setData] = useState(demandeAssignations);
  const [selectValue, setSelectValue] = useState<any>('');
  const [nomComplet, setNomComplet] = useState<string>('');
  const [restaurantSelectedId, setRestaurantSelectId] = useState<string | null>(null);
  const [demandeAssignationId, setDemandeAssignation] = useState<string>('');

  useEffect(() => {
    if (selectValue) {
      setData(demandeAssignations.filter((item) => item.nomComplet && item.nomComplet.toLowerCase().includes(selectValue.toLowerCase())));
    } else {
      setData(demandeAssignations);
    }
  }, [selectValue, demandeAssignations]);

  /**
   * Le statut d'une demande d'assignation.
   *
   * <p>Les trois pastilles etaient peintes a la main : `bg-info` (un jeton hérité qui n'a
   * pas de variante sombre), `bg-green-500` (palette Tailwind brute) et `bg-primary`,
   * c'est-a-dire le ROUGE DE MARQUE pour dire « rejete ». Le rouge de marque de cet ERP
   * signale ce qui appelle une action ; un rejet deja prononce n'en appelle plus.</p>
   *
   * <p>Le cas par defaut rendait la chaine « Inconu » — sans pastille, et avec une faute.
   * Une demande dont on ne sait pas lire le statut est une lacune : elle se signale.</p>
   */
  const recupererStatut = (statutDemandeAssignation?: string) => {
    switch (statutDemandeAssignation) {
      case 'EN_ATTENTE':
        // L'attente est le deroulement NORMAL d'une demande : elle ne s'alarme pas.
        return (
          <Chip size="sm" variant="soft">
            <Chip.Label>En attente</Chip.Label>
          </Chip>
        );
      case 'VALIDE':
        return (
          <Chip color="success" size="sm" variant="soft">
            <Chip.Label>Validé</Chip.Label>
          </Chip>
        );
      case 'REJETER':
        return (
          <Chip color="danger" size="sm" variant="soft">
            <Chip.Label>Rejeté</Chip.Label>
          </Chip>
        );
      default:
        return (
          <Chip color="warning" size="sm" variant="soft">
            <Chip.Label>Statut inconnu</Chip.Label>
          </Chip>
        );
    }
  };

  const onOpenDialog = (item: DemandeAssignationVM) => {
    setNomComplet(item.nomComplet ?? '');
    setDemandeAssignation(item.id ?? '');
    onOpen();
  };

  const onCloseDialog = () => {
    onClose();
    setNomComplet('');
  };

  const valider = async () => {
    try {
      const result = await validerDemandeAssignations({
        demandeAssignationId: demandeAssignationId,
        restaurantId: restaurantSelectedId ?? '',
      });
      if (result.status === 'success') {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Une erreur s'est produite !");
    }
  };

  const rejeter = async () => {
    try {
      const result = await rejeterDemandeAssignations(demandeAssignationId);
      if (result.success === 'success') {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Une erreur s'est produite !");
    } finally {
      router.refresh();
    }
  };

  const openAutoriserDialog = (item: DemandeAssignationVM) => {
    setNomComplet(item.nomComplet ?? '');
    setDemandeAssignation(item.id ?? '');
    onOpen();
  };

  const retirer = (id?: string) => {
    confirm.setMessage('Êtes-vous sûr de vouloir retirer ce livreur ? ');
    const confirmAndRemove = async () => {
      try {
        const result = await rejeterDemandeAssignations(id ?? '');
        if (result.status == 'success') {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Une erreur s'est produite !");
      }
    };
    confirm.openConfirmDialog(confirmAndRemove);
    router.refresh();
  };

  const accortder = async (livreur: DemandeAssignationVM) => {
    if (!livreur) {
      toast.error("Une erreur s'est produite !");
      return false;
    }

    confirm.setMessage('Êtes-vous sûr de vouloir accorder cette demande ? ');

    const confirmAndAccorder = async () => {
      try {
        const result = await validerDemandeAssignations({
          demandeAssignationId: livreur?.id ?? '',
          restaurantId: '',
        });
        if (result.status === 'success') {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Une erreur s'est produite");
      } finally {
        confirm.setMessage('');
      }
    };
    confirm.openConfirmDialog(confirmAndAccorder);
    router.refresh();
  };

  return {
    data,
    selectValue,
    setSelectValue,
    recupererStatut,
    onOpenDialog,
    onCloseDialog,
    nomComplet,
    isOpen,
    setRestaurantSelectId,
    restaurantSelectedId,
    valider,
    rejeter,
    demandeAssignationId,
    openAutoriserDialog,
    retirer,
    confirm,
    accortder,
  };
}
