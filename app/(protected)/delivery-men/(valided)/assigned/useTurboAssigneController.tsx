'use client';

import useConfirm from '@/components/commons/use-confirm-dialog';
import { changerRestaurantLivreur, changerStatusLivreur, getToutLivreurStatusAssigners, mettreLivreurEnAttente } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant, TypeEnum } from '@/types/models';
import { useDisclosure } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export function useTurboAssigneController(initialData: PaginatedResponse<LivreurStatutVM[]> | null, restaurants: Restaurant[] | null) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<LivreurStatutVM[]> | null>(initialData);
  const confirm = useConfirm();
  const [restaurantSelected, setRestaurantSelected] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [livreur, setLivreur] = useState<LivreurStatutVM | undefined>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [updateLivreurId, setUpdateLivreurId] = useState('');
  const [refresh, setRefresh] = useState(false);

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

  const onConfirmStatut = (livreur: LivreurStatutVM, typeLivreur?: any) => {
    confirm.setMessage('Êtes-vous sûr de vouloir changer le statut de ce livreur en bird?');
    const confirmAndSend = async () => {
      const livreurRestaurant = restaurants?.find((item) => item.nomEtablissement === livreur.restaurantLibelle);
      if (!livreur) {
        toast.error('Veuillez choisir un statut');
        return false;
      }
      if (!livreurRestaurant) {
        toast.error('Restaurant non trouvé');
        return false;
      }
      try {
        const result = await changerStatusLivreur({
          livreurId: livreur?.livreurId ?? '',
          restaurantId: livreurRestaurant.id,
          typeLivreur: typeLivreur,
        });
        if (result.status === 'success') {
          toast.success(result.message);
          setUpdateLivreurId('');
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Une erreur s'est produite");
      }
    };
    confirm.openConfirmDialog(confirmAndSend);
  };

  const changerRestaurantLivreurs = async (livreur: LivreurStatutVM) => {
    confirm.setMessage('Êtes-vous sûr de vouloir changer le restaurant de ce livreur ?');
    const confirmAndSend = async () => {
      if (!restaurantSelected) {
        toast.error('Veuillez choisir un restaurant');
        return false;
      }
      try {
        const result = await changerRestaurantLivreur({
          livreurId: livreur?.livreurId ?? '',
          restaurantId: restaurantSelected,
        });
        if (result.status === 'success') {
          toast.success(result.message);
          setUpdateLivreurId('');
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Une erreur s'est produite");
      }
    };
    confirm.openConfirmDialog(confirmAndSend);
  };

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getToutLivreurStatusAssigners(page - 1, pageSize);
      newData && setData(newData);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la récupération des données');
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerLivreur = (livreur: LivreurStatutVM) => {
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
    restaurantSelected,
    setRestaurantSelected,
    initialData,
    modifier,
    setSearchKey,
    searchKey,
    livreur,
    isOpen,
    onOpen,
    onClose,
    onConfirmStatut,
    confirm,
    fetchData,
    currentPage,
    pageSize,
    isLoading,
    restaurants,
    updateLivreurId,
    setUpdateLivreurId,
    setLivreur,
    supprimerLivreur,
    changerRestaurantLivreurs,
  };
}
