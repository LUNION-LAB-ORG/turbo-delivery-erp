import { Metadata } from 'next';

import SectionHeader from '@/components/dashboard/price-liste/SectionHeader';

import { RestaurantDefini } from '@/types/price-list';
import { getRestaurantDefined } from '@/src/price-list/price-list.action';
import Content from './content';

export const metadata: Metadata = {
  title: 'Restaurants ayant des livraisons définies ',
  description: 'La liste des restaurants qui ont des livraisons définies.',
};

export default async function Page() {
  const initialData: RestaurantDefini[] = await getRestaurantDefined();

  return (
    <>
      <SectionHeader />
      <Content initialData={initialData} />;
    </>
  );
}
