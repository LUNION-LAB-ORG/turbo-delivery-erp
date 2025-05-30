'use client';

import useConfirm from '@/components/commons/use-confirm-dialog';
import { changerStatusLivreur, getToutLivreurStatusNonAssigners, mettreLivreurEnAttente } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM } from '@/types/models';
import { useDisclosure } from '@heroui/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export function useTurboysBirdController(initialData: PaginatedResponse<LivreurStatutVM[]> | null) {
  const router = useRouter();
  const confirm = useConfirm();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [data, setData] = useState<PaginatedResponse<LivreurStatutVM[]> | null>(initialData);
  const [searchKey, setSearchKey] = useState<string>('');
  const [livreur, setLivreur] = useState<LivreurStatutVM | undefined>({});
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [updateLivreurId, setUpdateLivreurId] = useState('');

  useEffect(() => {
    if (searchKey && initialData && initialData.content) {
      const data = (initialData.content || []).filter((item: any) => item.nomPrenom?.toLowerCase().includes(searchKey?.toLowerCase()));
      setData({ ...initialData, content: data });
    } else {
      setData(initialData);
    }
  }, [searchKey, initialData]);

  const modifier = (livreur: LivreurStatutVM) => {
    setLivreur(livreur);
    onOpen();
  };

  const onConfirmStatut = (livreur: LivreurStatutVM, typeLivreur: any) => {
    confirm.setMessage('Êtes-vous sûr de vouloir changer ce livreur ? ');
    const confirmAndSend = async () => {
      if (!livreur) {
        toast.error('Veuillez choisir un statut');
        return false;
      }
      try {
        const result = await changerStatusLivreur({
          livreurId: livreur?.livreurId ?? '',
          restaurantId: '',
          typeLivreur: typeLivreur,
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
    confirm.openConfirmDialog(confirmAndSend);
  };

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getToutLivreurStatusNonAssigners(page - 1, pageSize);
      newData && setData(newData);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la récupération des données');
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerLivreur = (livreur: LivreurStatutVM, typeLivreur?: any) => {
    confirm.setMessage('Êtes-vous sûr de vouloir retirer ce livreur ? ');
    const confirmAndSend = async () => {
      if (!livreur) {
        toast.error('Veuillez choisir un statut');
        return false;
      }
      try {
        const result = await mettreLivreurEnAttente(livreur?.livreurId ?? '');
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
    confirm.openConfirmDialog(confirmAndSend);
  };

  return {
    data,
    searchKey,
    setSearchKey,
    initialData,
    modifier,
    livreur,
    isOpen,
    onClose,
    onConfirmStatut,
    confirm,
    fetchData,
    currentPage,
    pageSize,
    isLoading,
    updateLivreurId,
    setUpdateLivreurId,
    supprimerLivreur,
  };
}
