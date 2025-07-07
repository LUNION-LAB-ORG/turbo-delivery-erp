import { Metadata } from 'next';
import { getDeliveryMen, getToutLivreurStatusNonAssigners } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { DeliveryMan, LivreurStatutVM } from '@/types/models';
import Content from './content';
import { allRestaurants } from '@/src/restaurants/restaurants.actions';

export const metadata: Metadata = {
    title: 'Delivery Men',
};


export default async function DeliveryMen() {
    const toutStatutLivreurNonAssignes: PaginatedResponse<LivreurStatutVM> | null = await getToutLivreurStatusNonAssigners(0, 10);
    const allRestaurant = await allRestaurants();
    return (
        <Content initialData={toutStatutLivreurNonAssignes} restaurants={allRestaurant} />
    );
}
