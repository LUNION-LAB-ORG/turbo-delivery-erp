'use server';

import { LivreurDisponible } from '@/types/models';
import { apiClientHttp } from '@/lib/api-client-http';

// Configuration
const BASE_URL = '/api/erp/trafic';

const traficEndpoints = {
    getTraficLivreurs: { endpoint: `${BASE_URL}/livreur`, method: 'GET' },
};

export async function getTraficLivreurs(): Promise<LivreurDisponible[]> {
    try {
        const data = await apiClientHttp.request<LivreurDisponible[]>({
            endpoint: traficEndpoints.getTraficLivreurs.endpoint,
            method: traficEndpoints.getTraficLivreurs.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        return [];
    }
}
