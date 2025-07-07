'use client';
import { useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { _deliveryFeeCreateSchema, _deliveryFeeUpdateSchema } from '@/src/schemas/delivery-fee.shema';
import { createDeliveryFee } from '@/src/price-list/price-list.action';
import { Restaurant } from '@/types/models';

export interface DeliveryFeesViewModel {
    isLoading: boolean;
    error: string | null;
    createOrUpdateFee: (payload: _deliveryFeeUpdateSchema) => void;
    deleteFee: (id: string) => Promise<void>;
    typeCommission:string
}

export default function useContentHeaderPriceListDefined(initialData:Restaurant[]|null,id:string): DeliveryFeesViewModel {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [typeCommission,setTypeCommission] =useState<string>("non definie")

   
    const [state, createOrUpdateFee, isCreatePending] = useFormState(
        async (_: any, data: _deliveryFeeUpdateSchema) => {
            setError(null);            
            let result;
            
            result = await createDeliveryFee(data);
            setIsLoading(false);
            if(result.status === 'success'){
            router.refresh();
            toast.success(result.message || 'Bravo ! vous avez réussi');
      typeof window !== 'undefined' && window.location.reload();
            } else{
                setError(result.message ?? 'Une erreur est survenue');
            }
            router.refresh();
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
        setIsLoading(false);
    };

    return {
        isLoading: isCreatePending || isLoading,
        error,
        createOrUpdateFee,
        deleteFee,
        typeCommission
    };
}
