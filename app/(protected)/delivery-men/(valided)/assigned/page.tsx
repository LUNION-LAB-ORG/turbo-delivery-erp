import { getToutLivreurStatusAssigners } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM } from '@/types/models';
import Content from './content';
import { allRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function DeliveryMen() {
    const toutStatutLivreurAssignes: PaginatedResponse<LivreurStatutVM[]> | null = await getToutLivreurStatusAssigners(0, 5);
    const allRestaurant = await allRestaurants();
    return (
        <Content initialData={toutStatutLivreurAssignes} restaurants={allRestaurant} />
    );
}
