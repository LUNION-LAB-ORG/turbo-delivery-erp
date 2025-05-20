'use client';
import { useSearchParams } from 'next/navigation';
import {  getPriceListByRestaurant } from '@/src/price-list/price-list.action';
import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import {  Tooltip } from '@heroui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { _deliveryFeeCreateSchema, deliveryFeeCreateSchema } from '@/src/price-list/price-list.schema';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';
import FormUpDate from '../../../components/dashboard/price-liste/FormUpDate';
import PriceListeTools from '@/components/dashboard/price-liste/price-list-tools';
import { useRouter } from 'next/navigation';
import { Restaurant } from '@/types/models';
// import { getDetailRestaurant } from '@/src/actions/restaurants.actions';
import { getDetailRestaurant } from '@/src/restaurants/restaurants.actions';
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

export default function ViewTablePriceLiceDefined({ initialData }: Props) {    
    
   
    const [typeCommission,setTypeCommission] = useState<string|null>(initialData.length !== 0 ? initialData[0].typeCommission : null)


    const tabs = initialData.map((resto) => ({ id: resto.id, nomComplet: resto.nomEtablissement }));
   

    const tabsRef = useRef<HTMLDivElement>(null);
    const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
    
    const [defaultVal,setDefaultVal]=useState<DeliveryFee| undefined>()
    const [selectedKey, setSelectedKey] = useState<string | null>(initialData.length !== 0 ? initialData[0].id : null);
    const [inputValue, setInputValue] = useState<string>('');
    const [search,setSearch] = useState<string|null>(null)
    const [initialDataPriceList,setInitialDataPriceList] = useState<DeliveryFee[]>([])
    const searchParams = useSearchParams(); 
    const textParam = searchParams.get('text'); 
  

    useEffect(() => { 
        // Initialiser search à partir de textParam
        setSearch(textParam);
      
        // Si search n'est pas vide, filtrer les données
        if (search !== null && search.trim() !== "") {
          const filtered = initialDataPriceList.filter(item => 
            item.zone.toLowerCase().includes(search.toLowerCase())
          ) || [];
          setDeliveryFees(filtered);
          console.log("search non");
        } else {
          // Si search est vide, restaurer la liste initiale
          setDeliveryFees(initialDataPriceList);
        }
      
      }, [search, textParam, initialDataPriceList]);
      

    const handleChangeSelectedKey = async (key: string) => {
        setSelectedKey(key);
        const detailRestaurant= await getDetailRestaurant(key)
        if(detailRestaurant)
        setTypeCommission(detailRestaurant.typeCommission) 
         console.log("setTypeCommission :"+typeCommission);
                 
    };


    const handleMoveScrool = (value: 100 | -100) => {
        tabsRef?.current?.scrollTo({
            left: tabsRef?.current?.scrollLeft + value,
            behavior: 'smooth',
        });
    };

    const handleFetchDeliveryFee = async (restaurantId: string) => {
        // Requete Server Action        
        const data = await getPriceListByRestaurant(restaurantId, 0, 10);
        if(data)
        setInitialDataPriceList(data?.content);   
            
    };

  
    useEffect(() => {
        if (selectedKey) {
            handleFetchDeliveryFee(selectedKey);
        }
    }, [selectedKey]);

    const renderCell = useCallback((delieveryFee: DeliveryFee, columnKey: any) => {
        setDefaultVal(delieveryFee)
        
        switch (columnKey) {
            case 'name':
                return (
                    <span>                       
                        {delieveryFee.name}
                    </span>
                );
            case 'zone':
                return (
                    <span>                       
                        {delieveryFee.zone}
                    </span>
                );
            case 'distance':
                return (
                    <span>
                        {delieveryFee.distanceFin}  Km
                    </span>
                );
            case 'prix':
                return <span>{delieveryFee.prix} (XOF)</span>;
            case 'commission':
                return <span>
                    {delieveryFee.commission}
                    {typeCommission === 'POURCENTAGE' ? '(POURCENTAGE %)' : 
      typeCommission === 'FIXE' ? '(XOF)' : ' (type Non definie)'}
                    </span>;
            case 'actions':
                return (
                    <div className="relative flex items-center gap-2">
                        <Tooltip content="Edit user">
                            <FormUpDate initialData={delieveryFee} restaurantId={selectedKey} typeCm={typeCommission} />
                        </Tooltip>
                        <Tooltip color="danger" content="Delete user">
                       <PriceListeTools id={delieveryFee.id ||''} />
                        </Tooltip>
                    </div>
                );
            default:
                return <></>;
        }
    }, []);

    return {
        columns,
        selectedKey,
        tabs,
        tabsRef,
        deliveryFees,
        handleMoveScrool,
        handleFetchDeliveryFee,
        handleChangeSelectedKey,
        renderCell,
    };
}
