'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';
import { BonLivraison } from '@/types/bon-livraison.model';
import { PaginatedResponse } from '@/types';
import { formatDate } from '@/utils/date-formate';

// Configuration
const BASE_URL = '/api/erp/bon-livraison';

const bonLivraisonEndpoints = {
    getBonLivraisonAll: {
        endpoint: `${BASE_URL}/tous`,
        method: 'GET',
    },
};

export async function getBonLivraisonAll(page: number, size: number, date?: string | null): Promise<PaginatedResponse<BonLivraison> | null> {
    try {
        const params: { page: string; size: string; date?: string } = {
            page: String(page),
            size: String(size),
        };

        if (date) {
            params.date = date; // Ajout de la date si elle est fournie
        }

        const data = await apiClientHttp.request({
            endpoint: bonLivraisonEndpoints.getBonLivraisonAll.endpoint,
            method: bonLivraisonEndpoints.getBonLivraisonAll.method,
            params: params,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        console.log("error", error)
        return null;
    }
}
