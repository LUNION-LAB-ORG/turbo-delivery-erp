'use client';

import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import { Avatar } from '@heroui/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
    initialData: RestaurantDefini[];
}
// export const columns = [
//     { name: 'Zone', uid: 'zone' },
//     { name: 'Distance', uid: 'distance' },
//     // { name: 'Coût de livraison', uid: 'prix' },
//     // { name: 'Commission', uid: 'commission' },
//     { name: 'Action', uid: 'actions' },
// ];

export default function useContent({ initialData }: Props) {

    const [initialDataPriceList, setInitialDataPriceList] = useState<DeliveryFee[]>([])
    const [search, setSearch] = useState<string | null>(null)

    const searchParams = useSearchParams();
    const textParam = searchParams.get('text');

    const tabsRef = useRef<HTMLDivElement>(null);
    const [undefinedRestaurant, setUndefinedRestaurant] = useState<RestaurantDefini[] | null>(initialData);


    useEffect(() => {
        console.log("textParam", textParam)
        // Initialiser search à partir de textParam
        setSearch(textParam);

        // Si search n'est pas vide, filtrer les données
        if (search !== null && search.trim() !== "") {
            const filtered = initialData.filter(item =>
                item.nomEtablissement.toLowerCase().includes(search.toLowerCase())
            ) || [];
            setUndefinedRestaurant(filtered);
        } else {
            // Si search est vide, restaurer la liste initiale
            setUndefinedRestaurant(initialData);
        }

    }, [search, textParam, initialDataPriceList]);


    // const tabs = initialData.map((resto) => ({ id: resto.id, nomComplet: resto.nomEtablissement }));


    const renderCell = useCallback((undefinedRestaurant: RestaurantDefini, columnKey: any) => {
        switch (columnKey) {
            case 'nomEtablissement':
                return (
                    <span className="flex items-center gap-3">
                        <Avatar isBordered radius="full" size="md" src={undefinedRestaurant.logo_Url} />
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
        // columns,
        // tabs,
        tabsRef,
        undefinedRestaurant,
        renderCell,
    };
}
