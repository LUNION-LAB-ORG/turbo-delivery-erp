'use server';

import { apiClient } from '@/lib/api-client';
import { ActionResult, PaginatedResponse } from '@/types/index.d';

import { DeliveryMan } from '@/types/models';
import deliveryMenEndpoints from '@/src/endpoints/delivbery-men.endpoint';

export async function getDeliveryMen(): Promise<PaginatedResponse<DeliveryMan> | null> {
    const response = await apiClient.get(deliveryMenEndpoints.getAll);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function getDeliveryMenValidated(): Promise<PaginatedResponse<DeliveryMan> | null> {
    const response = await apiClient.get(deliveryMenEndpoints.getAllValidated);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function getDeliveryMenNoValidated(): Promise<PaginatedResponse<DeliveryMan> | null> {
    const response = await apiClient.get(deliveryMenEndpoints.getAllNoValidated);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function validateDeliveryMan(id: string, validateBy: 'auth' | 'ops' | 'no-body'): Promise<ActionResult<DeliveryMan>> {
    if (validateBy == 'auth') {
        const response = await apiClient.get(deliveryMenEndpoints.validateAuth(id));
        let message = '';
        try {
            const result = await response.json();
            message = result.message;
        } catch (error) {
            const result = await response.text();
            message = result;
        }
        if (!response.ok) {
            return {
                status: 'error',
                message: message ?? "Erreur lors de l'activation du livreur",
            };
        }
        return {
            status: 'success',
            message: 'Livreur activé avec succès',
        };
    }
    if (validateBy == 'ops') {
        const response = await apiClient.get(deliveryMenEndpoints.validateOps(id));
        let message = '';
        try {
            const result = await response.json();
            message = result.message;
        } catch (error) {
            const result = await response.text();
            message = result;
        }
        if (!response.ok) {
            return {
                status: 'error',
                message: message ?? "Erreur lors de l'activation du livreur",
            };
        }
        return {
            status: 'success',
            message: 'Livreur activé avec succès',
        };
    }
    return {
        status: 'error',
        message: 'Méthode de validation invalide',
    };
}
