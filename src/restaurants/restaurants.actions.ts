'use server';

import { ActionResult, PaginatedResponse } from '@/types';
import {Restaurant } from '@/types/models';
import { apiClientHttp } from '@/lib/api-client-http';
import { restaurantUpdateCommission } from '@/types/restaurants.model';

// Configuration
const BASE_URL = '/api/erp/restaurant';
const BASE_URL_2 = '/api/erp/validation/restaurant';

const restaurantEndpoints = {
  base: {
    endpoint: BASE_URL,
    method: 'GET',
  },
  base_2: {
    endpoint: BASE_URL_2,
    method: 'GET',
  },
  getDetailRestaurant: {
    endpoint: (idRestaurant: string) => `${BASE_URL}/${idRestaurant}`,
    method: 'GET',
  },
  getAll: {
    endpoint: (page:number)=> `${BASE_URL_2}/validated/opsmanager/${page}`,
    method: 'GET',
  },
  getAlls: {
    endpoint: BASE_URL,
    method: 'GET',
  },
  getAllValidated: {
    endpoint: (page:number)=> `${BASE_URL_2}/validated/authservice/${page}`,
    method: 'GET',
  },
  getAllNoValidated: {
    endpoint: (page:number)=> `${BASE_URL_2}/not/validated/${page}`,
    method: 'GET',
  },
  validateAuth: {
    endpoint: (idRestaurant: string) => `${BASE_URL_2}/validate/by/authservice/${idRestaurant}`,
    method: 'GET',
  },
  validateOps: {
    endpoint: (idRestaurant: string) => `${BASE_URL_2}/validate/by/opsmanager/${idRestaurant}`,
    method: 'GET',
  },
  info: {
    endpoint: (idRestaurant: string) => `${BASE_URL_2}/info/${idRestaurant}`,
    method: 'GET',
  },
  allRestaurants: {
    endpoint: `${BASE_URL}`,
    method: 'GET',
  },
  updateCommission: {
    endpoint: `${BASE_URL}/update-commission`,
    method: 'POST',
  },
};

export async function getDetailRestaurant(idRestaurant: string): Promise<Restaurant | null> {
  try {
    const data = await apiClientHttp.request<Restaurant>({
      endpoint: restaurantEndpoints.getDetailRestaurant.endpoint(idRestaurant),
      method: restaurantEndpoints.getDetailRestaurant.method,
    });

    return data;
  } catch (error) {
    return null;
  }
}   

export async function getRestaurants(page: number): Promise<PaginatedResponse<Restaurant> | null> {
  try {
    const data = await apiClientHttp.request<PaginatedResponse<Restaurant>>({
      endpoint: restaurantEndpoints.getAll.endpoint(page),
      method: restaurantEndpoints.getAll.method,
      service: 'erp',
    });
    return data;
  } catch (error) {
    return null;
  }
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  try {
    const data = await apiClientHttp.request({
      endpoint: restaurantEndpoints.getAlls.endpoint,
      method: restaurantEndpoints.getAlls.method,
      service: 'backend',
    });
    return data;
  } catch (error) {
    return [];
  }
}

export async function getRestaurantsValidated(page: number): Promise<PaginatedResponse<Restaurant> | null> {
  try {
    const data = await apiClientHttp.request<PaginatedResponse<Restaurant>>({
      endpoint: restaurantEndpoints.getAllValidated.endpoint(page),
      method: restaurantEndpoints.getAllValidated.method,
      service: 'erp',
    });

    return data;
  } catch (error) {
    return null;
  }
}

export async function getRestaurantsNoValidated(page: number): Promise<PaginatedResponse<Restaurant> | null> {
  try {
    const data = await apiClientHttp.request<PaginatedResponse<Restaurant>>({
      endpoint: restaurantEndpoints.getAllNoValidated.endpoint(page),
      method: restaurantEndpoints.getAllNoValidated.method,
      service: 'erp',
    });

    return data;
  } catch (error) {
    return null;
  }
}

export async function validateRestaurant(id: string, validateBy: 'auth' | 'ops' | 'no-body'): Promise<ActionResult<Restaurant>> {
  if (validateBy == 'auth') {
    try {
      const data = await apiClientHttp.request<Restaurant>({
        endpoint: restaurantEndpoints.validateAuth.endpoint(id),
        method: restaurantEndpoints.validateAuth.method,
        service: 'erp',
      });
      return {
        status: 'success',
        message: 'Restaurant activé avec succès',
        data: data,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? "Erreur lors de l'activation du restaurant",
      };
    }
  }
  if (validateBy == 'ops') {
    try {
      const data = await apiClientHttp.request<Restaurant>({
        endpoint: restaurantEndpoints.validateOps.endpoint(id),
        method: restaurantEndpoints.validateOps.method,
        service: 'erp',
      });
      return {
        status: 'success',
        message: 'Restaurant activé avec succès',
        data: data,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? "Erreur lors de l'activation du restaurant",
      };
    }
  }
  return {
    status: 'error',
    message: 'Méthode de validation invalide',
  };
}

export async function allRestaurants(): Promise<Restaurant[]> {
  try {
    const data = await apiClientHttp.request<Restaurant[]>({
      endpoint: restaurantEndpoints.allRestaurants.endpoint,
      method: restaurantEndpoints.allRestaurants.method,
    });
    return data;
  } catch (error) {
    return [] as Restaurant[];
  }
}

export async function updateCommission({ body }: { body: restaurantUpdateCommission }): Promise<ActionResult> {
  try {
    const data = await apiClientHttp.request<Restaurant[]>({
      endpoint: restaurantEndpoints.updateCommission.endpoint,
      method: restaurantEndpoints.updateCommission.method,
      data: body,
      service: 'backend',
    });
    return {
      data,
      status: 'success',
    };
  } catch (error: any) {
    return {
      message: 'Erreur lors du changement de mot de passe',
      status: 'error',
    };
  }
}
