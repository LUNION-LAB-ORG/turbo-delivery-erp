import { Metadata } from 'next';
import { getToutLivreurStatus } from '@/src/actions/delivery-men.actions';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM } from '@/types/models';
import Content from './content';
import { allRestaurants } from '@/src/restaurants/restaurants.actions';

export const metadata: Metadata = {
  title: 'Delivery Men',
};

export default async function DeliveryMen() {
  const toutStatutLivreurs: PaginatedResponse<LivreurStatutVM> | null = await getToutLivreurStatus(0, 10);
  const allRestaurant = await allRestaurants();
  // console.log(toutStatutLivreurs)
  return <Content initialData={toutStatutLivreurs} restaurants={allRestaurant} />;  
}
