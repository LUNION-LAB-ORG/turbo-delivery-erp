'use client';

import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import createUrlFile from '@/utils/createUrlFile';
import { Avatar } from '@heroui/react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { getRestaurantUndefined2 } from '@/src/price-list/price-list.action';
import { toast } from 'react-toastify';

interface Props {
    initialData: PaginatedResponse<RestaurantDefini> | null;
}

export default function useContent({ initialData }: Props) {
    const [isLoading, setIsLoading] = useState(!initialData);
    const [currentPage, setCurrentPage] = useState(1);
    const [data, setData] = useState<PaginatedResponse<RestaurantDefini> | null>(initialData);

    const [initialDataPriceList, setInitialDataPriceList] = useState<DeliveryFee[]>([])
   
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
    //     console.log("textParam", textParam)
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


    const renderCell = useCallback((undefinedRestaurant: RestaurantDefini, columnKey: any) => {
        switch (columnKey) {
            case 'nomEtablissement':
                return (
                    <span className="flex items-center gap-3">
                        <Avatar isBordered radius="full" size="md" src={createUrlFile(undefinedRestaurant.logo_Url, 'restaurant')} />
                        {undefinedRestaurant.nomEtablissement}
                    </span>
                );
            case 'typeCommission':
                return (<span>
                    {undefinedRestaurant.typeCommission === 'POURCENTAGE' ? 'POURCENTAGE %' :
                        undefinedRestaurant.typeCommission === 'FIXE' ? '(XOF)' : 'Non definie'};
                    {/* {undefinedRestaurant.typeCommission == 'POURCENTAGE' ? ' POURCENTAGE %' :undefinedRestaurant.typeCommission == '(XOF)'? '(XOF)':''} */}
                </span>
                );
            case 'actions':
                return (
                    <Link

                        href={`/restaurants/${undefinedRestaurant.id}`}
                        className='bg-red-500 text-white font-semibold py-2 px-4 rounded-xl'
                    >
                        Definie type restaurent
                    </Link>
                );
            default:
                return <></>;
        }
    }, []);

    return {
        renderCell,
        data,
        fetchData,
        currentPage,
        isLoading,
    };
}
