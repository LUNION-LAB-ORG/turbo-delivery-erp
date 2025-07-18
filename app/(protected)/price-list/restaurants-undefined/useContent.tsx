'use client';

import { RestaurantDefini } from '@/types/price-list';
import createUrlFile from '@/utils/createUrlFile';
import { Avatar } from '@heroui/react';
import Link from 'next/link';
import { useCallback } from 'react';
interface Props {
    initialData: RestaurantDefini[];
}

export default function useContent({ initialData }: Props) {


    const renderCell = useCallback((undefinedRestaurant: RestaurantDefini, columnKey: any) => {
        switch (columnKey) {
            case 'nomEtablissement':
                return (
                    <span className="flex items-center gap-3">
                        <Avatar isBordered radius="full" size="md" src={createUrlFile(undefinedRestaurant.logo_Url, 'restaurant')} />
                        {undefinedRestaurant.nomEtablissement}
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
        undefinedRestaurant: initialData,
        renderCell,
    };
}
