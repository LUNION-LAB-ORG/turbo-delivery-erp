import { Metadata } from 'next';

import { getRestaurantUndefined2 } from '@/src/price-list/price-list.action';
import Content from './Content';
import { RestaurantDefini } from '@/types/price-list';
import SectionHeader from '@/components/dashboard/price-liste/SectionHeader';
import { PaginatedResponse } from '@/types';

export const metadata: Metadata = {
  title: "Restaurants n'ayant pas des livraisons définies",
  description: "La liste des restaurants qui n'ont pas de livraisons définies.",
};

export default async function PageContent() {
  const initialData: PaginatedResponse<RestaurantDefini> | null = await getRestaurantUndefined2(0);

  return (
    <>
      <SectionHeader />
      <Content initialData={initialData} />
    </>
  );
}
