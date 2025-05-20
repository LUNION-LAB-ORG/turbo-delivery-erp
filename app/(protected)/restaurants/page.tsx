import { Metadata } from 'next';
import Content from './content';
import { getRestaurants } from '@/src/restaurants/restaurants.actions';

export const metadata: Metadata = {
    title: 'Restaurants',
};

export default async function Restaurants() {
    // Server action
    const restaurants = await getRestaurants(0, 10);

    return (
        <Content initialData={restaurants} />

    );
}
