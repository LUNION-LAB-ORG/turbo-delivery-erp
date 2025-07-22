'use client';

import useConfirm from '@/components/commons/use-confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { rejeterDemandeAssignations, validerDemandeAssignations } from '@/src/actions/delivery-men.actions';
import { DemandeAssignationVM } from '@/types/models';
import { useDisclosure } from '@heroui/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export function useDemandeAssignationController(demandeAssignations: DemandeAssignationVM[]) {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
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

  const recupererStatut = (sttatutDemandeAssignation?: string) => {
    switch (sttatutDemandeAssignation) {
      case 'EN_ATTENTE':
        return <Badge className="bg-info rounded-lg pl-2 pr-2 text-sm">En attente</Badge>;
      case 'VALIDE':
        return <Badge className="bg-green-500 rounded-lg pl-2 pr-2 text-sm">Validé</Badge>;
      case 'REJETER':
        return <Badge className="bg-primary rounded-lg pl-2 pr-2 text-sm">Rejeté</Badge>;
      default:
        return 'Inconu';
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
