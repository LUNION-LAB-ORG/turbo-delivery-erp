'use client';

import useConfirm from '@/components/commons/use-confirm-dialog';
import DeliveryMenStatusTools from '@/components/dashboard/delivery-men/delivery-men-status-tools';
import { changerStatusLivreur, getToutLivreurStatus } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant, TypeEnum } from '@/types/models';
import { Button, Chip, useDisclosure } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { Key, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export const columns = [
  { name: 'Prénoms & Nom', uid: 'nomPrenom' },
  { name: 'Téléphone', uid: 'telephone' },
  { name: 'État du compte', uid: 'status' },
  { name: 'Identification du livreur', uid: 'type' },
  { name: 'Propriétaire', uid: 'patenaire' },
  // { name: 'Identification final du livreur', uid: 'identificationFinal' },
  { name: 'Actions', uid: 'actions' },
];

export const options = [
  { key: 'libre', label: 'Libre, identifier-le' },
  { key: 'utilise-partout', label: 'Utilisé partout' },
  { key: 'restaurant-agha', label: 'Restaurant AGAHA' },
];

// interface IRestaurant {
//     id?: string;
//     key?: string;
//     libelle?: string;
// };

interface Props {
  initialData: PaginatedResponse<LivreurStatutVM[]> | null;
  restaurants: Restaurant[] | null;
}

export default function useContentCtx({ initialData, restaurants }: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const birdDisclosure = useDisclosure();
  const freeDisclosure = useDisclosure();
  const deliverStatusDisclosure = useDisclosure();
  const [isLoading, setIsLoading] = useState(!initialData);
  const [searchKey, setSearchKey] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<PaginatedResponse<LivreurStatutVM[]> | null>(initialData);
  const [livreur, setLivreur] = useState<LivreurStatutVM | null>(null);
  const [validateBy, setValidateBy] = useState<'auth' | 'ops'>('auth');

  useEffect(() => {
    if (searchKey && initialData && initialData.content) {
      const data = (initialData.content || []).filter((item: any) => item.nomPrenom?.toLowerCase().includes(searchKey?.toLowerCase()));
      setData({ ...initialData, content: data });
    } else {
      setData(initialData);
    }
  }, [searchKey, initialData]);

  // Fonction de récupération des données
  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getToutLivreurStatus(page - 1, pageSize);
      newData && setData(newData);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la récupération des données');
    } finally {
      setIsLoading(false);
      router.refresh();
    }
  };

  const getInitials = (nomPrenom?: string) => {
    return nomPrenom?.charAt(0).toUpperCase();
  };

  const getColorFromInitial = (initial: string) => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF3', '#FFC733', '#FF5733', '#75FF33', '#FF3385', '#33A1FF', '#F333FF'];
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  };
  const renderCell = useCallback((livreur: LivreurStatutVM | null, columnKey?: Key) => {
    const cellValue = livreur && livreur[columnKey as keyof LivreurStatutVM];
    const initial = livreur && getInitials(livreur.nomPrenom);
    const bgColor = getColorFromInitial(initial ?? '');

    switch (columnKey) {
      case 'nomPrenom':
        return (
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-md" style={{ backgroundColor: bgColor }}>
              {initial}
            </div>
            <div className="font-medium capitalize">{livreur?.nomPrenom}</div>
          </div>
        );
      case 'status':
        switch (cellValue) {
          case 2:
            return (
              <Chip
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setLivreur(livreur);
                  setValidateBy('auth');
                  deliverStatusDisclosure.onOpen();
                }}
                color={'secondary'}
              >
                {'En attente'}
              </Chip>
            );
          case 3:
            return (
              <Chip
                size="sm"
                onClick={() => {
                  setLivreur(livreur);
                  setValidateBy('ops');
                  deliverStatusDisclosure.onOpen();
                }}
                color={'danger'}
                className="cursor-pointer"
              >
                {'Validé'}
              </Chip>
            );
          case 4:
            return (
              <Chip size="sm" color={'success'}>
                {'Activé'}
              </Chip>
            );
          case 5:
            return (
              <Chip size="sm" color={'danger'}>
                {'Rejeté'}
              </Chip>
            );
        }
      case 'type':
        switch (cellValue) {
          case 'FREE':
            return (
              <Chip size="sm" className="bg-[#679cf2] text-white pl-2 pr-2">
                {'Bird'}
              </Chip>
            );
          case 'TURBO':
            return (
              <Chip size="sm" className="bg-[#770eaf]  pl-2 pr-2 text-white">
                {'Assigné'}
              </Chip>
            );
          case 'WAITING':
            return (
              <Chip size="sm" className="bg-orange-200  pl-2 pr-2">
                {'En attente'}
              </Chip>
            );
        }

      case 'patenaire':
        return (
          <div className="font-medium capitalize">
            {livreur?.type && livreur?.type === ('FREE' as any) ? (
              <span>Peut être utilisé partout</span>
            ) : livreur?.type && livreur?.type === ('WAITING' as any) ? (
              <Button
                size="sm"
                onPress={() => {
                  setLivreur(livreur);
                  birdDisclosure.onOpen();
                }}
                className="cursor-pointer"
              >
                Libre, identifiez le
              </Button>
            ) : (
              livreur?.restaurantLibelle
            )}
          </div>
        );
      case 'actions':
        return <DeliveryMenStatusTools deliveryMan={livreur} validateBy={`${livreur?.status === 2 ? 'auth' : livreur?.status === 3 ? 'ops' : 'no-body'}`} />;
      default:
        return cellValue;
    }
  }, []);

  const renderCols = useCallback((column: { name: string; uid: string }) => {
    return <div className="flex gap-2 text-primary">{column.name}</div>;
  }, []);

  const changerStatus = () => {
    const confirmAndSend = async () => {
      if (!livreur) {
        toast.error("Une erreur s'est produite !");
        return false;
      }
      try {
        const result = await changerStatusLivreur({
          livreurId: livreur?.livreurId ?? '',
          restaurantId: '',
          typeLivreur: 'FREE',
        });
        if (result.status === 'success') {
          toast.success(result.message);
          birdDisclosure.onClose();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error("Une erreur s'est produite");
      } finally {
        router.refresh();
      }
    };
    confirm.openConfirmDialog(confirmAndSend);
  };

  return {
    renderCell,
    renderCols,
    columns,
    data,
    fetchData,
    currentPage,
    isLoading,
    searchKey,
    setSearchKey,
    birdDisclosure,
    confirm,
    changerStatus,
    freeDisclosure,
    deliverStatusDisclosure,
    validateBy,
    livreur,
  };
}
