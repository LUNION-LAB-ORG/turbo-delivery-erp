'use server';

import { ActionResult, PaginatedResponse } from '@/types';
import { apiClientHttp } from '@/lib/api-client-http';
import { Restaurant } from '@/types/creneau-turbo';
import {  LivreurBird } from '@/types/creneau-bird';
import { LivreurPerformance } from '@/types/creneau-performance';
import { CreneauxRestaurantProgression } from '@/types/creneaux-progression';
import { PerformanceCreneauId } from '@/types/performance-creneauId';

// Configuration
const BASE_URL = '/api/erp/gestion-creneau/turbo/progression';

const creneauEndpoints = {
    base: {
        endpoint: BASE_URL,
        method: 'GET',
    },
 
    getAllCreneauxPerformanceTurbo: {
        endpoint: `${BASE_URL}/turbo`,
        method: 'GET',
    },

    getAllCreneauBird: {
        endpoint: `${BASE_URL}/bird`,
        method: 'GET',
    },

};


export async function getAllCreneauxPerformanceTurbo(page: number = 0, size: number = 10): Promise<any> {
    try {
        const data = await apiClientHttp.request<any>({
            endpoint: creneauEndpoints.getAllCreneauxPerformanceTurbo.endpoint,
            method: creneauEndpoints.getAllCreneauxPerformanceTurbo.method,
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


export async function getAllCreneauBird(page: number = 0, size: number = 10): Promise<PaginatedResponse<LivreurBird> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<LivreurBird> | null>({
            endpoint: creneauEndpoints.getAllCreneauBird.endpoint,
            method: creneauEndpoints.getAllCreneauBird.method,
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

// export async function getCreneauPerformanceId(creneauId: string): Promise<PerformanceCreneauId| null> {
//     try {
//         const data = await apiClientHttp.request<PerformanceCreneauId|null>({
//             endpoint: creneauEndpoints.getCreneauPerformanceId.endpoint(creneauId),
//             method: creneauEndpoints.getCreneauPerformanceId.method,
//             service: 'backend',
//         });

//         return data;
//     } catch (error) {
//         return null;
//     }
// }




