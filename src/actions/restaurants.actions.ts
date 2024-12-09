'use server';

import { apiClient } from '@/lib/api-client';
import { ActionResult, PaginatedResponse } from '@/types/index.d';

import { Restaurant } from '@/types/models';
import restaurantsEndpoints from '@/src/endpoints/restaurants.endpoint';

export async function getRestaurants(): Promise<PaginatedResponse<Restaurant> | null> {
    const response = await apiClient.get(restaurantsEndpoints.getAll);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function getRestaurantsValidated(): Promise<PaginatedResponse<Restaurant> | null> {
    const response = await apiClient.get(restaurantsEndpoints.getAllValidated);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function getRestaurantsNoValidated(): Promise<PaginatedResponse<Restaurant> | null> {
    const response = await apiClient.get(restaurantsEndpoints.getAllNoValidated);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function validateRestaurant(id: string, validateBy: 'auth' | 'ops' | 'no-body'): Promise<ActionResult<Restaurant>> {
    if (validateBy == 'auth') {
        const response = await apiClient.get(restaurantsEndpoints.validateAuth(id));
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
                message: message ?? "Erreur lors de l'activation du restaurant",
            };
        }
        return {
            status: 'success',
            message: 'Restaurant activé avec succès',
        };
    }
    if (validateBy == 'ops') {
        const response = await apiClient.get(restaurantsEndpoints.validateOps(id));
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
                message: message ?? "Erreur lors de l'activation du restaurant",
            };
        }
        return {
            status: 'success',
            message: 'Restaurant activé avec succès',
        };
    }
    return {
        status: 'error',
        message: 'Méthode de validation invalide',
    };
}
