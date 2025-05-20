'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult, PaginatedResponse } from '@/types';
import { processFormData } from '@/utils/formdata-zod.utilities';
import { _deliveryFeeCreateSchema, _deliveryFeeUpdateSchema, deliveryFeeCreateSchema } from '../schemas/delivery-fee.shema';
import { DeliveryFee } from '@/types/delivery-fee.model';

const BASE_URL = '/api/erp/frais-livraison';

const deliveryFeeEndpoints = {
    createDeliveryFee: { endpoint: `${BASE_URL}`, method: 'POST' },
    updateDeliveryFee: { endpoint: `${BASE_URL}`, method: 'PUT' },
    getAllDeliveryFee: { endpoint: `${BASE_URL}/tous`, method: 'GET' },
    getPaginationDeliveryFee: { endpoint: `${BASE_URL}/pagination`, method: 'GET' },
    deleteDeliveryFee: { endpoint: (fraisLivraisonId: string) => `${BASE_URL}/${fraisLivraisonId}`, method: 'DELETE' },
};

export async function getAllDeliveryFee(): Promise<DeliveryFee[]> {
    try {
        const data = await apiClientHttp.request<DeliveryFee[]>({
            endpoint: deliveryFeeEndpoints.getAllDeliveryFee.endpoint,
            method: deliveryFeeEndpoints.getAllDeliveryFee.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        return [];
    }
}

export async function getPaginationDeliveryFee(page: number, size: number): Promise<PaginatedResponse<DeliveryFee> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<DeliveryFee>>({
            endpoint: deliveryFeeEndpoints.getPaginationDeliveryFee.endpoint,
            method: deliveryFeeEndpoints.getPaginationDeliveryFee.method,
            service: 'backend',
            params: {
                page: String(page),
                size: String(size),
            },
        });

        return data;
    } catch (error) {
        return null;
    }
}

// export async function createDeliveryFee(formData: _deliveryFeeCreateSchema): Promise<ActionResult<DeliveryFee>> {
//     const {
//         success,
//         data: formdata,
//         errorsInArray,
//     } = processFormData(deliveryFeeCreateSchema, formData, {
//         useDynamicValidation: true,
//         transformations: {
//             distanceDebut: (value) => Number(value),
//             distanceFin: (value) => Number(value),
//             prix: (value) => Number(value),
//             commission: (value) => Number(value),
//             longitude: (value) => Number(value),
//             latitude: (value) => Number(value),
//         },
//     });
//     console.log(formData);
//     return {
//         status: 'error',
//     };
//     // if (!success && errorsInArray) {
//     //     return {
//     //         status: 'error',
//     //         message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
//     //     };
//     // }

//     try {
//         const data = await apiClientHttp.request<DeliveryFee>({
//             endpoint: deliveryFeeEndpoints.createDeliveryFee.endpoint,
//             method: deliveryFeeEndpoints.createDeliveryFee.method,
//             data: formdata,
//             service: 'backend',
//         });

//         return {
//             status: 'success',
//             data,
//         };
//     } catch (error: any) {
//         return {
//             status: 'error',
//             message: error.response.data.message ?? 'Une erreur est survenue',
//         };
//     }
// }

export async function updateDeliveryFee(formData: _deliveryFeeUpdateSchema): Promise<ActionResult<DeliveryFee>> {
    const {
        success,
        data: formdata,
        errorsInArray,
    } = processFormData(deliveryFeeCreateSchema, formData, {
        useDynamicValidation: true,
        transformations: {
            distanceDebut: (value) => Number(value),
            distanceFin: (value) => Number(value),
            prix: (value) => Number(value),
            commission: (value) => Number(value),
        },
    });
    console.log(formdata);
    return {
        status: 'error',
    };
    // if (!success && errorsInArray) {
    //     return {
    //         status: 'error',
    //         message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
    //     };
    // }

    try {
        const data = await apiClientHttp.request<DeliveryFee>({
            endpoint: deliveryFeeEndpoints.updateDeliveryFee.endpoint,
            method: deliveryFeeEndpoints.updateDeliveryFee.method,
            data: formdata,
            service: 'backend',
        });

        return {
            status: 'success',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error.response.data.message ?? 'Une erreur est survenue',
        };
    }
}

export async function deleteDeliveryFee(fraisLivraisonId: string): Promise<ActionResult> {
    try {
        await apiClientHttp.request<DeliveryFee[]>({
            endpoint: deliveryFeeEndpoints.deleteDeliveryFee.endpoint(fraisLivraisonId),
            method: deliveryFeeEndpoints.deleteDeliveryFee.method,
            service: 'backend',
        });

        return {
            status: 'success',
            message: 'Vous avez bien supprimé le frais',
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error.response.data.message ?? 'Une erreur est survenue',
        };
    }
}
