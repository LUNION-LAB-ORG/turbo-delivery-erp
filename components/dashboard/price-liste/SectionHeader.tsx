import Header from './header';
import { Restaurant } from '@/types/models';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function SectionHeader() {
  // const initialData: RestaurantDefini[] = mockRestaurants;
  const initialData: Restaurant[] | null = await getAllRestaurants();

  return <Header initialData={initialData} />;
}
