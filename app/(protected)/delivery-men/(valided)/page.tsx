import { getToutLivreurStatus } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM } from '@/types/models';
import Content from './content';
import { allRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function DeliveryMen() {
  const toutStatutLivreurs: PaginatedResponse<LivreurStatutVM[]> | null = await getToutLivreurStatus(0, 10);
  const allRestaurant = await allRestaurants();
  return <Content initialData={toutStatutLivreurs} restaurants={allRestaurant} />;
}
