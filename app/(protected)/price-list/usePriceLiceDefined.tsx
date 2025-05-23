'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import { Tooltip } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import FormUpDate from '@/components/dashboard/price-liste/FormUpDate';
import PriceListeTools from '@/components/dashboard/price-liste/price-list-tools';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';
import { Restaurant } from '@/types/models';

interface Props {
  initialData: RestaurantDefini[];
}

export const columns = [
  { name: 'Nom', uid: 'name' },
  { name: 'Zone', uid: 'zone' },
  { name: 'Distance', uid: 'distance' },
  { name: 'Coût de livraison', uid: 'prix' },
  { name: 'Commission', uid: 'commission' },
  { name: 'Action', uid: 'actions' },
];

export default function usePriceLiceDefined({ initialData }: Props) {

  
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const tabs = initialData.map((resto) => ({ id: resto.id, nomComplet: resto.nomEtablissement }));
  const initialSelectedKey = searchParams.get('restoId') || (initialData.length > 0 ? initialData[0].id : null);
  const [selectedKey, setSelectedKey] = useState<string | null>(initialSelectedKey);
  const [currentRestaurant, setCurrentRestaurant] = useState<Restaurant | null>(null);



  useEffect(() => {
    if (!selectedKey && initialData.length > 0) {
      setSelectedKey(initialData[0].id);
    }
  }, [initialData, selectedKey]);

  useEffect(()=>{
   let pa= params.get('restoId');
    console.log({pa:pa});
    
  },[])

  const handleChangeSelectedKey = (key: string) => {
    setSelectedKey(key);
    params.set('restoId', key);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    async function fetchDetailRestaurant() {
      if (selectedKey) {
        const detailRestaurant = await getDetailRestaurant(selectedKey);
        if (detailRestaurant) {
          setCurrentRestaurant(detailRestaurant);
        }
      }
    }
    fetchDetailRestaurant();
  }, [selectedKey]);

  const [initialDataPriceList, setInitialDataPriceList] = useState<DeliveryFee[]>([]);
  

  const handleFetchDeliveryFee = async (restaurantId: string) => {
    const data = await getPriceListByRestaurant(restaurantId, 0, 10);
    if (data) {
      setInitialDataPriceList(data.content);
    }
  };

  useEffect(() => {
    if (currentRestaurant) {
      handleFetchDeliveryFee(currentRestaurant.id);
    }
  }, [currentRestaurant]);

  const search = searchParams.get('search');
  const deliveryFees = search ? initialDataPriceList.filter((item) => item.zone.toLowerCase().includes(search.toLowerCase())) : initialDataPriceList;
  
  const tabsRef = useRef<HTMLDivElement>(null);
  const handleMoveScroll = (value: number) => {
    if (tabsRef.current) {
      tabsRef.current.scrollTo({
        left: tabsRef.current.scrollLeft + value,
        behavior: 'smooth',
      });
    }
  };

  const renderCell = useCallback(
    (deliveryFee: DeliveryFee, columnKey: string) => {
      switch (columnKey) {
        case 'name':
          return <span>{deliveryFee.name}</span>;
        case 'zone':
          return <span>{deliveryFee.zone}</span>;
        case 'distance':
          return <span>{deliveryFee.distanceFin} Km</span>;
        case 'prix':
          return <span>{deliveryFee.prix} (XOF)</span>;
        case 'commission':
          return (
            <span>
              {deliveryFee.commission}
              {currentRestaurant?.typeCommission === 'POURCENTAGE' ? ' (POURCENTAGE %)' : currentRestaurant?.typeCommission === 'FIXE' ? ' (XOF)' : ' (type non défini)'}
            </span>
          );
        case 'actions':
          return (
            <div className="relative flex items-center gap-2">
              <Tooltip content="Edit user">
                <FormUpDate typeCm={currentRestaurant?.typeCommission ?? ""} initialData={deliveryFee} restaurantId={selectedKey || ''} />
              </Tooltip>
              <Tooltip color="danger" content="Delete user">
                <PriceListeTools id={deliveryFee.id || ''} />
              </Tooltip>
            </div>
          );
        default:
          return null;
      }
    },
    [currentRestaurant?.typeCommission, selectedKey],
  );

  return {
    columns,
    selectedKey,
    tabs,
    tabsRef,
    deliveryFees,
    handleMoveScroll,
    handleFetchDeliveryFee,
    handleChangeSelectedKey,
    renderCell,
  };
}
