'use client';

import { RestaurantDefini } from '@/types/price-list';

import { ListeRestaurantsIndefinis } from '../_composants/liste-restaurants-indefinis';

export default function Content({ initialData }: { initialData: RestaurantDefini[] }) {
  return <ListeRestaurantsIndefinis restaurants={initialData ?? []} />;
}
