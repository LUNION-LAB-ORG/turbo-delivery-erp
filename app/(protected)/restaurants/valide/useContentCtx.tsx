'use client';

import RestaurantTools from '@/components/dashboard/restaurants/restaurant-tools';
import { getRestaurantsValidated } from '@/src/restaurants/restaurants.actions';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import createUrlFile from '@/utils/createUrlFile';
import { Avatar, Chip } from '@heroui/react';
import { Key, useCallback, useState } from 'react';
import { toast } from 'react-toastify';

export const columns = [
    { name: "Nom de l'établissement", uid: 'nomEtablissement' },
    { name: 'Email', uid: 'email' },
    { name: 'Téléphone', uid: 'telephone' },
    { name: 'Localisation', uid: 'localisation' },
    { name: 'État du compte', uid: 'status' },
    { name: 'Actions', uid: 'actions' },
];

export const options = [
    { key: 'libre', label: 'Libre, identifier-le' },
    { key: 'utilise-partout', label: 'Utilisé partout' },
    { key: 'restaurant-agha', label: 'Restaurant AGAHA' },
];

interface Props {
    initialData: PaginatedResponse<Restaurant> | null;
}

export default function useContentCtx({ initialData }: Props) {
    const [isLoading, setIsLoading] = useState(!initialData);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    const [data, setData] = useState<PaginatedResponse<Restaurant> | null>(initialData);

    // Fonction de récupération des données
    const fetchData = async (page: number) => {
        setCurrentPage(page);
        setIsLoading(true);
        try {
            const newData = await getRestaurantsValidated();
            setData(newData);
        } catch (error) {
            toast.error('Erreur lors de la récupération des données');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCell = useCallback((restaurant: Restaurant, columnKey: Key) => {
        const cellValue = restaurant[columnKey as keyof Restaurant];

        switch (columnKey) {
            case 'nomEtablissement':
                return (
                    <div className="flex items-center gap-4">
                        <Avatar src={createUrlFile(restaurant?.logo_Url ?? '', 'restaurant')} />
                        <div className="font-medium capitalize">{restaurant.nomEtablissement}</div>
                    </div>
                );
            case 'status':
                return (
                    <Chip size="sm" color={cellValue == 2 ? 'warning' : 'default'}>
                        {cellValue == 2 ? 'Partiellement' : 'Inconnu'}
                    </Chip>
                );
            case 'actions':
                return <RestaurantTools restaurant={restaurant} validateBy="ops" setData={setData} />;
            default:
                return cellValue;
        }
    }, []);

    const renderCols = useCallback((column: { name: string; uid: string }) => {
        return <div className="flex gap-2 text-primary">{column.name}</div>;
    }, []);

    return {
        renderCell,
        renderCols,
        columns,
        data,
        fetchData,
        currentPage,
        isLoading,
    };
}
