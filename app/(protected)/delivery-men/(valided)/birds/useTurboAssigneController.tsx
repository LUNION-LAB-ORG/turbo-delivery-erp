'use client';

import useConfirm from '@/components/commons/use-confirm-dialog';
import { changerStatusLivreur, getToutLivreurStatusNonAssigners, mettreLivreurEnAttente } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM } from '@/types/models';
import { useDisclosure } from '@heroui/react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

export function useTurboysBirdController(initialData: PaginatedResponse<LivreurStatutVM> | null) {
  const router = useRouter();
  const confirm = useConfirm();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [data, setData] = useState<PaginatedResponse<LivreurStatutVM> | null>(initialData);
  const [allDataForFilter, setAllDataForFilter] = useState<LivreurStatutVM[]>([]);
  const [searchKey, setSearchKey] = useState<string>('');
  const [livreur, setLivreur] = useState<LivreurStatutVM | undefined>({});
  const [pageSize] = useState(10);
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
        // Charger toutes les données pour le filtrage
        const allData = await getToutLivreurStatusNonAssigners(0, 1000);
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
    const totalPages = Math.ceil(filtered.length / pageSize);
    const paginatedContent = filtered.slice(startIndex, endIndex);
    
    return {
      content: paginatedContent,
      totalPages: totalPages,
      totalElements: filtered.length,
      size: pageSize,
      number: currentPage - 1,
      numberOfElements: paginatedContent.length,
      first: currentPage === 1,
      last: currentPage === totalPages,
      empty: filtered.length === 0,
      pageable: {
        pageNumber: currentPage - 1,
        pageSize: pageSize,
        offset: (currentPage - 1) * pageSize,
        paged: true,
        unpaged: false,
        sort: { sorted: false, empty: true, unsorted: true }
      },
      sort: { sorted: false, empty: true, unsorted: true }
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
      // Utiliser le pageNumber du backend qui commence à 0
      const newData = await getToutLivreurStatusNonAssigners(page - 1, pageSize);
      if (newData) {
        setData(newData);
      }
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
    setCurrentPage: handlePageChange,
    pageSize,
    isLoading,
    updateLivreurId,
    setUpdateLivreurId,
    supprimerLivreur,
  };
}