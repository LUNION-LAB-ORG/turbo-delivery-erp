'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';
import { PaginatedResponse } from '@/types';
import { DeliveryFee, RestaurantDefini } from '@/types/price-list';
import { processFormData } from '@/utils/formdata-zod.utilities';
import { _deliveryFeeCreateSchema, deliveryFeeCreateSchema } from './price-list.schema';

// Configuration
const BASE_URL = '/api/erp/frais-livraison';

const priceListEndpoints = {
    create: {
        endpoint: BASE_URL,
        method: 'POST',
    },
    update: {
        endpoint: BASE_URL,
        method: 'PUT',
    },
    getPriceListByRestaurant: {
        endpoint: (restaurantID: string) => `${BASE_URL}/${restaurantID}/restaurant`,
        method: 'GET',
    },
    // getPriceListById: {
    //     endpoint: (fraisDeLivraisonId: string) => `${BASE_URL}/${fraisDeLivraisonId}`,
    //     method: 'GET',
    // },
    deletePriceList: {
        endpoint: (fraisDeLivraisonId: string) => `${BASE_URL}/${fraisDeLivraisonId}`,
        method: 'DELETE',
    },
    getRestaurantUndefined: {
        endpoint: `${BASE_URL}/restaurant/non-defini`,
        method: 'GET',
    },
    getRestaurantDefined: {
        endpoint: `${BASE_URL}/restaurant/defini`,
        method: 'GET',
    },
};



export async function getRestaurantDefined(): Promise<RestaurantDefini[]> {
    try {
        const data = await apiClientHttp.request<RestaurantDefini[]>({
            endpoint: priceListEndpoints.getRestaurantDefined.endpoint,
            method: priceListEndpoints.getRestaurantDefined.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        console.log("error+++++++++++++++++++++++++++", error)
        return [];
    }
}
export async function getRestaurantUndefined(): Promise<RestaurantDefini[]> {
    try {
        const data = await apiClientHttp.request<RestaurantDefini[]>({
            endpoint: priceListEndpoints.getRestaurantUndefined.endpoint,
            method: priceListEndpoints.getRestaurantUndefined.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        return [];
    }
}
export async function getPriceListByRestaurant(restaurantID: string, page: number, size: number): Promise<PaginatedResponse<DeliveryFee> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<DeliveryFee>>({
            endpoint: priceListEndpoints.getPriceListByRestaurant.endpoint(restaurantID),
            method: priceListEndpoints.getPriceListByRestaurant.method,
            params: {
                page: page.toString(),
                size: String(size),
            },
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        return null;
    }
}

export async function createDeliveryFee(formData: _deliveryFeeCreateSchema): Promise<ActionResult<DeliveryFee>> {
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
            longitude: (value) => Number(value),
            latitude: (value) => Number(value),
        },
    });

    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }

    try {
        const data = await apiClientHttp.request<_deliveryFeeCreateSchema>({
            endpoint: priceListEndpoints.create.endpoint,
            method: priceListEndpoints.create.method,
            data: formdata,
            service: 'backend',
        });

        // const data=formdata

        console.log(data);

        return {
            status: 'success',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? 'Une erreur est survenue',
        };
    }
}

export async function updatePriceList(formData: _deliveryFeeCreateSchema): Promise<ActionResult<DeliveryFee>> {
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
            longitude: (value) => Number(value),
            latitude: (value) => Number(value),
        },
    });

    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }

    try {
        const data = await apiClientHttp.request<_deliveryFeeCreateSchema>({
            endpoint: priceListEndpoints.update.endpoint,
            method: priceListEndpoints.update.method,
            data: formdata,
            service: 'backend',
        });

        // const data=formdata

        console.log({ data: data });

        return {
            status: 'success',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? 'Une erreur est survenue',
        };
    }
}


export async function deletePriceList(fraisDeLivraisonId: string) {
    // const {
    //     success,
    //     data: formdata,
    //     errorsInArray,
    // } = processFormData(deliveryFeeCreateSchema, formData, {
    //     useDynamicValidation: true,
    //     transformations: {
    //         distanceDebut: (value) => Number(value),
    //         distanceFin: (value) => Number(value),
    //         prix: (value) => Number(value),
    //         commission: (value) => Number(value),
    //         longitude: (value) => Number(value),
    //         latitude: (value) => Number(value),
    //     },
    // });

    // if (!success && errorsInArray) {
    //     return {
    //         status: 'error',
    //         message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
    //     };
    // }

    try {
        const data = await apiClientHttp.request<string>({
            endpoint: priceListEndpoints.deletePriceList.endpoint(fraisDeLivraisonId),
            method: priceListEndpoints.deletePriceList.method,
            data: fraisDeLivraisonId,
            service: 'backend',
        });

        // const data=formdata

        console.log(data);

        return {
            status: 'success',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? 'Une erreur est survenue',
        };
    }
}
