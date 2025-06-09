'use client';
import { useEffect, useState } from 'react';
import { DeliveryFee } from '@/types/delivery-fee.model';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
// import { createDeliveryFee, deleteDeliveryFee, updateDeliveryFee } from '@/src/actions/delivery-fee.action';
import { _deliveryFeeCreateSchema, _deliveryFeeUpdateSchema } from '@/src/schemas/delivery-fee.shema';
import { createDeliveryFee } from '@/src/price-list/price-list.action';
import { Restaurant } from '@/types/models';

export interface DeliveryFeesViewModel {
    // fees: DeliveryFee[];
    isLoading: boolean;
    error: string | null;
    // selectedFee: DeliveryFee | null;
    createOrUpdateFee: (payload: _deliveryFeeUpdateSchema) => void;
    deleteFee: (id: string) => Promise<void>;
    // selectFee: (fee: DeliveryFee | null) => void;
    typeCommission:string
}

export default function useContentHeaderPriceListDefined(initialData:Restaurant[]|null,id:string): DeliveryFeesViewModel {
    const router = useRouter();
    // const [fees, setFees] = useState<DeliveryFee[]>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typeCommission,setTypeCommission] =useState<string>("non definie")

   
    const [state, createOrUpdateFee, isCreatePending] = useFormState(
        async (_: any, data: _deliveryFeeUpdateSchema) => {
            setError(null);
            let result;

        
            result = await createDeliveryFee(data);
            if(result.status === 'success'){
                
            router.refresh()
            toast.success(result.message || 'Bravo ! vous avez réussi');
            console.log(result);

            } else{
                setError(result.message ?? 'Une erreur est survenue');
            }
            return _;
           
        },
        {
            data: null,
            message: '',
            errors: {},
            status: 'idle',
            code: undefined,
        },
    );

    const deleteFee = async (id: string) => {
        // setError(null);

        // const result = await deleteDeliveryFee(id);

        // if (result.status === 'success') {
        //     toast.success(result.message || 'Bravo ! vous avez réussi');
        //     router.refresh();
        // } else {
        //     setError(result.message ?? 'Une erreur est survenue');
        // }
        setIsLoading(false);
    };

    // const selectFee = (fee: DeliveryFee | null) => {
    //     setSelectedFee(fee);
    // };

    return {
        isLoading: isCreatePending || isLoading,
        error,
        createOrUpdateFee,
        deleteFee,
        // selectFee,
        typeCommission
    };
}
