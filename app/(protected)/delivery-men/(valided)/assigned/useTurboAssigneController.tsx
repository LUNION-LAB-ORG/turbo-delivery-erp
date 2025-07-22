'use client';

import useConfirm from '@/components/commons/use-confirm-dialog';
import { changerRestaurantLivreur, changerStatusLivreur, getToutLivreurStatusAssigners, mettreLivreurEnAttente } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant, TypeEnum } from '@/types/models';
import { useDisclosure } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';

export function useTurboAssigneController(initialData: PaginatedResponse<LivreurStatutVM> | null, restaurants: Restaurant[] | null) {
  const router = useRouter();
  const [data, setData] = useState<PaginatedResponse<LivreurStatutVM> | null>(initialData);
  const [allDataForFilter, setAllDataForFilter] = useState<LivreurStatutVM[]>([]);
  const confirm = useConfirm();
  const [restaurantSelected, setRestaurantSelected] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [livreur, setLivreur] = useState<LivreurStatutVM | undefined>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [updateLivreurId, setUpdateLivreurId] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  // Charger toutes les données pour le filtrage côté client
  useEffect(() => {
    const loadAllData = async () => {
      if (!searchKey.trim()) {
        setIsFiltering(false);
        return;
      }
      
      setIsFiltering(true);
      try {
        // Charger toutes les données pour le filtrage (vous pouvez ajuster cette logique)
        const allData = await getToutLivreurStatusAssigners(0, 1000); // Récupérer un grand nombre
        if (allData?.content) {
          setAllDataForFilter(allData.content);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données pour le filtrage:', error);
      }
    };

    loadAllData();
  }, [searchKey]);

  // Filtrage des données quand on a une recherche
  const filteredData = useMemo(() => {
    if (!searchKey.trim() || !isFiltering) {
      return null; // Pas de filtrage, utiliser les données paginées du serveur
    }

    const filtered = allDataForFilter.filter((item: LivreurStatutVM) => {
      const searchTerm = searchKey.toLowerCase();
      const nomPrenom = item.nomPrenom?.toLowerCase() || '';
      const telephone = item.telephone?.toLowerCase() || '';
      const restaurantLibelle = item.restaurantLibelle?.toLowerCase() || '';
      
      return nomPrenom.includes(searchTerm) ||
             telephone.includes(searchTerm) ||
             restaurantLibelle.includes(searchTerm);
    });

    // Pagination côté client des données filtrées
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      content: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / pageSize),
      totalElements: filtered.length,
      currentPage: currentPage,
      size: pageSize,
      first: currentPage === 1,
      last: currentPage === Math.ceil(filtered.length / pageSize),
      numberOfElements: filtered.slice(startIndex, endIndex).length,
      number: currentPage - 1,
      empty: filtered.length === 0
    };
  }, [allDataForFilter, searchKey, currentPage, pageSize, isFiltering]);

  // Réinitialiser la page quand on fait une recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKey]);

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
      if (newData) {
        setData(newData);
      }
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

  // Fonction pour changer de page
  const handlePageChange = (page: number) => {
    if (searchKey.trim()) {
      // Pagination côté client pour les données filtrées
      setCurrentPage(page);
    } else {
      // Pagination côté serveur pour les données non filtrées
      fetchData(page);
    }
  };

  // Retourner les données filtrées ou les données du serveur
  const finalData = filteredData || data;

  return {
    data: finalData,
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
    setCurrentPage: handlePageChange,
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