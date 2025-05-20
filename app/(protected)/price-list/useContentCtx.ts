'use client';
import { useState } from 'react';
import { DeliveryFee } from '@/types/delivery-fee.model';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { _deliveryFeeCreateSchema, _deliveryFeeUpdateSchema } from '@/src/schemas/delivery-fee.shema';
import { createDeliveryFee, updatePriceList } from '@/src/price-list/price-list.action';

export interface DeliveryFeesViewModel {
    isLoading: boolean;
    error: string | null;
    createOrUpdateFee: (payload: _deliveryFeeUpdateSchema) => void;

}

export default function useContentCtx(DataUpDate:DeliveryFee|null): DeliveryFeesViewModel {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [state, createOrUpdateFee, isCreatePending] = useFormState(
        async (_: any, data: _deliveryFeeUpdateSchema) => {
            setError(null);
            let result;
                
            if(DataUpDate)
                try{
                    data = { ...data, id: DataUpDate.id };
                    result=  await updatePriceList(data)
                   console.log(result);
                    toast.success(result.message || 'Bravo ! vous avez réussi');
                   router.refresh();

            }catch(error){
                toast.success( 'Une erreur sait produite');

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


    return {
        isLoading: isCreatePending || isLoading,
        error,
        createOrUpdateFee,
    };
}
