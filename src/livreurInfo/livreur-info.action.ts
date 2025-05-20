
'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { LivreurDetail } from '@/types/livreur';

// Configuration
const BASE_URL = '/api/erp/livreur/info';

const livreurInfoEndpoints = {
    base: {
        endpoint: BASE_URL,
        method: 'GET',
    },
 
    getInfoLivreurId: {
        endpoint: (userId: string) => `${BASE_URL}/${userId}`,
        method: 'GET',
    },
};


export async function getInfoLivreurById(userId: string):Promise<LivreurDetail|null> {
  
    try {
        const data = await apiClientHttp.request<LivreurDetail|null>({
            endpoint: livreurInfoEndpoints.getInfoLivreurId.endpoint(userId),
            method: livreurInfoEndpoints.getInfoLivreurId.method,
            service: 'backend',
        });
                
        return data;
    } catch (error: any) {
        return null;
    }
}







