'use client';

import useConfirm from '@/components/commons/use-confirm-dialog';
import DeliveryMenStatusTools from '@/components/dashboard/delivery-men/delivery-men-status-tools';
import { changerStatusLivreur, getToutLivreurStatus } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant } from '@/types/models';
import { Button, Chip, useDisclosure } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { Key, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// 🧼 Fonction utilitaire pour nettoyer les données
const sanitizeLivreurs = (content: any[] | null | undefined): LivreurStatutVM[] =>
  (content || []).filter(
    (item): item is LivreurStatutVM =>
      !!item && typeof item === 'object' && !!item.livreurId && item.nomPrenom !== 'null null'
  );

export const columns = [
  { name: 'Prénoms & Nom', uid: 'nomPrenom' },
  { name: 'Téléphone', uid: 'telephone' },
  { name: 'État du compte', uid: 'status' },
  { name: 'Identification du livreur', uid: 'type' },
  { name: 'Propriétaire', uid: 'partenaire' },
  { name: 'Actions', uid: 'actions' },
];

interface Props {
  initialData: PaginatedResponse<LivreurStatutVM> | null;
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
  const [data, setData] = useState<PaginatedResponse<LivreurStatutVM> | null>(
    initialData ? { ...initialData, content: sanitizeLivreurs(initialData.content) } : null
  );
  const [livreur, setLivreur] = useState<LivreurStatutVM | null>(null);
  const [validateBy, setValidateBy] = useState<'auth' | 'ops'>('auth');

  useEffect(() => {
    if (searchKey && initialData && initialData.content) {
      const filtered = sanitizeLivreurs(initialData.content).filter((item) =>
        item.nomPrenom?.toLowerCase().includes(searchKey.toLowerCase())
      );
      setData({ ...initialData, content: filtered });
    } else {
      setData(initialData ? { ...initialData, content: sanitizeLivreurs(initialData.content) } : null);
    }
  }, [searchKey, initialData]);

  const fetchData = async (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
    try {
      const newData = await getToutLivreurStatus(page - 1, pageSize);
      if (newData) {
        newData.content = sanitizeLivreurs(newData.content).map(item => ({
          ...item,
          livreurId: item.livreurId ?? '',
          telephone: item.telephone ?? '',
          avatarUrl: '',
          nomComplet: '',
          position: { longitude: 0, latitude: 0 },
        }));
        setData(newData);
        // router.replace(`?page=${page}`, { scroll: false });
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la récupération des données');
    } finally {
      setIsLoading(false);
      // router.refresh();
    }
  };

  const getInitials = (nomPrenom?: string) => nomPrenom?.charAt(0).toUpperCase() || '?';

  const getColorFromInitial = (initial: string) => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF3', '#FFC733', '#75FF33', '#FF3385', '#33A1FF', '#F333FF'];
    const index = initial.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderCell = useCallback((livreur: LivreurStatutVM | null, columnKey?: Key) => {
    if (!livreur || !columnKey) return null;
    const cellValue = livreur[columnKey as keyof LivreurStatutVM];
    const initial = getInitials(livreur.nomPrenom);
    const bgColor = getColorFromInitial(initial);

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
              <Chip size="sm" className="cursor-pointer" onClick={() => {
                setLivreur(livreur);
                setValidateBy('auth');
                deliverStatusDisclosure.onOpen();
              }} color="secondary">
                En attente
              </Chip>
            );
          case 3:
            return (
              <Chip size="sm" color="danger" className="cursor-pointer" onClick={() => {
                setLivreur(livreur);
                setValidateBy('ops');
                deliverStatusDisclosure.onOpen();
              }}>
                Validé
              </Chip>
            );
          case 4:
            return <Chip size="sm" color="success">Activé</Chip>;
          case 5:
            return <Chip size="sm" color="danger">Rejeté</Chip>;
        }
        break;
      case 'type':
        switch (cellValue) {
          case 'FREE':
            return <Chip size="sm" className="bg-[#679cf2] text-white px-2">Bird</Chip>;
          case 'TURBO':
            return <Chip size="sm" className="bg-[#770eaf] text-white px-2">Assigné</Chip>;
          case 'WAITING':
            return <Chip size="sm" className="bg-orange-200 px-2">En attente</Chip>;
        }
        break;
      case 'partenaire':
        return (
          <div className="font-medium capitalize">
            {livreur.type === 'FREE' ? (
              <span>Peut être utilisé partout</span>
            ) : livreur.type === 'WAITING' ? (
              <Button size="sm" onPress={() => {
                setLivreur(livreur);
                birdDisclosure.onOpen();
              }} className="cursor-pointer">
                Libre, identifiez-le
              </Button>
            ) : (
              livreur.restaurantLibelle
            )}
          </div>
        );
      case 'actions':
        return <DeliveryMenStatusTools deliveryMan={livreur} validateBy={livreur.status === 2 ? 'auth' : livreur.status === 3 ? 'ops' : 'no-body'} />;
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
        return;
      }
      try {
        const result = await changerStatusLivreur({
          livreurId: livreur.livreurId ?? '',
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
