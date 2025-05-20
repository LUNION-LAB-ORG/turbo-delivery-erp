'use client';

import { getBonLivraisonAll } from '@/src/actions/bon-commande.action';
import { PaginatedResponse } from '@/types';
import { BonLivraison } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';
import { CalendarDate, RangeValue, Switch } from '@heroui/react';
import { Key, useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export const columns = [
    { name: 'Référence', uid: 'reference' },
    { name: 'Date et Heure', uid: 'date' },
    { name: 'Livreur', uid: 'livreur' },
    { name: 'Restaurant', uid: 'restaurant' },
    { name: 'Coût livraison', uid: 'coutLivraison' },
    { name: 'Coût commande', uid: 'coutCommande' },
    { name: 'Terminé', uid: 'statut' },
];

interface Props {
    initialData: PaginatedResponse<BonLivraison> | null;
    restaurants: Restaurant[]
}

export default function useContentCtx({ initialData, restaurants }: Props) {
    const [isLoading, setIsLoading] = useState(!initialData);
    const [currentPage, setCurrentPage] = useState(0);
    // const [currentPage, setCurrentPage] = useState(initialData?.totalPages ?? 1);
    const [pageSize] = useState(10);
    const [data, setData] = useState<PaginatedResponse<BonLivraison> | null>(initialData);

    // Crée un état pour stocker la date sélectionnée
    const [birthDate, setBirthDate] = useState<string | null>(null);

    // Fonction de gestion du changement de date
    const handleDateChange = (value: CalendarDate | null) => {
        if (value) {
            const date = new Date(value.toString());
            const formattedDate = date.toISOString().split('T')[0];
            setBirthDate((state) => formattedDate);
            handlerPage(1);
        } else {
            setBirthDate(null);
        }
    };

    const handleCangeRestaurant = (restaurantId: any) => {
        const restaurant = restaurants?.find((item) => item.id === restaurantId);
        if (!initialData) return;

        const dataFilter = initialData.content?.filter((item) =>
            item.restaurant.toLocaleLowerCase().includes(restaurant?.nomEtablissement?.toLocaleLowerCase() ?? "")
        ) || [];
        if (restaurantId) {
            setData({ ...initialData, content: dataFilter });
        }
    }

    const handlerPage = (page: number) => {
        setCurrentPage((state) => page);
    };
    useEffect(() => {
        const fetchData = async () => {
            if (birthDate || currentPage) {
                setIsLoading(true);
                try {
                    const newData = await getBonLivraisonAll(currentPage, pageSize, birthDate);
                    setData(newData);
                } catch (error) {
                    toast.error('Erreur lors de la récupération des données');
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchData();
    }, [birthDate, currentPage, pageSize]);

    const renderCell = useCallback((bonLivraison: BonLivraison, columnKey: Key) => {
        const cellValue = bonLivraison[columnKey as keyof BonLivraison];
        switch (columnKey) {
            case 'coutLivraison':
                return <p>{String(cellValue) + ' FCFA'}</p>;
            case 'coutCommande':
                return <p>{String(cellValue) + ' FCFA'}</p>;
            case 'statut':
                return cellValue == 'TERMINER' ? <Switch size="sm" color="primary" readOnly isSelected /> : <Switch size="sm" isSelected={false} readOnly />;
            default:
                return cellValue;
        }
    }, []);

    return {
        renderCell,
        columns,
        data,
        handlerPage,
        currentPage,
        isLoading,
        handleDateChange,
        handleCangeRestaurant
    };
}
