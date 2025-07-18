import { getRestaurantsNoValidated } from '@/src/restaurants/restaurants.actions';
import { Metadata } from 'next';
import Content from './content';
export const metadata: Metadata = {
    title: 'Restaurants',
};

export default async function Restaurants() {
    const restaurants = await getRestaurantsNoValidated(0);

    return (
        <Content initialData={restaurants} />

    );
}
