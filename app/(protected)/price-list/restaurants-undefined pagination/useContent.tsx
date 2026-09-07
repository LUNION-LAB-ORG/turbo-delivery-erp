'use client';

import { RestaurantDefini } from '@/types/price-list';
import { useCallback, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { getRestaurantUndefined2 } from '@/src/price-list/price-list.action';
import { toast } from 'sonner';

interface Props {
    initialData: PaginatedResponse<RestaurantDefini> | null;
}

export default function useContent({ initialData }: Props) {
    const [isLoading, setIsLoading] = useState(!initialData);
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState<PaginatedResponse<RestaurantDefini> | null>(initialData);

    // Fonction de récupération des données
    const fetchData = useCallback(async (page: number) => {
        setIsLoading(true);
        try {
            const newData = await getRestaurantUndefined2(page - 1);
            setData(newData);
            setCurrentPage(page);
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la récupération des données');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // useEffect(() => {
    //     // Initialiser search à partir de textParam
    //     setSearch(textParam);

    //     // Si search n'est pas vide, filtrer les données
    //     if (search !== null && search.trim() !== "") {
    //         const filtered = initialData.filter(item =>
    //             item.nomEtablissement.toLowerCase().includes(search.toLowerCase())
    //         ) || [];
    //         setUndefinedRestaurant(filtered);
    //     } else {
    //         // Si search est vide, restaurer la liste initiale
    //         setUndefinedRestaurant(initialData);
    //     }

    // }, [search, textParam, initialDataPriceList]);


    // const tabs = initialData.map((resto) => ({ id: resto.id, nomComplet: resto.nomEtablissement }));


    /*
     * `renderCell` vivait ici : l'avatar, le nom, le type de commission et le lien
     * d'action. C'est le rendu de l'ecran, pas sa logique — il est parti dans le
     * composant partage `ListeRestaurantsIndefinis`, avec la variante non paginee.
     */

    return {
        data,
        fetchData,
        currentPage,
        isLoading,
    };
}
