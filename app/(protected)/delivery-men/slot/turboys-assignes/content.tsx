'use client';
import DropDownAction from '@/components/dashboard/slot/dropDownAction';
import { Restaurant } from '@/types/creneau-turbo';
import { TurboysAssignes, TurboysNotSlot } from '@/types/slot';
import { Avatar } from '@heroui/react';
import { IconPoint, IconPointFilled } from '@tabler/icons-react';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import progresseBare from '@/components/dashboard/delivery-men/progression/progression-barre';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import UserRestaurantListe from '@/components/dashboard/delivery-men/slot/assignes/user-restaurant-list';

interface Props {
  initialData: PaginatedResponse<Restaurant> | null;
  // initialData: Restaurant[] | null ;
}

export default function Content({ initialData }: Props) {
  const {turboysCreneau } = useContentCtx({ initialData });


  console.log({turboysCreneau:turboysCreneau});
  


  // const restaurants = data?.content ?? [];

 
  return (
    <div className="p-4 bbg-gray-100 min-h-screen">
         <UserRestaurantListe turboysCreneau={turboysCreneau}/>      
    </div>
  );
}
