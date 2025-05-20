import { Metadata } from 'next';
import Content from './content';
import NotFound from '@/app/not-found';
import { getDetailRestaurant } from '@/src/actions/restaurants.actions';

export const metadata: Metadata = {
  title: 'Restaurants',
};

export default async function Restaurants({ params }: { params: { restaurant_id: string } }) {
  const currentRestaurant = await getDetailRestaurant(params.restaurant_id);

  if (!currentRestaurant) {
    return <NotFound />;
  }

  return <Content restaurant={currentRestaurant} />;
}
