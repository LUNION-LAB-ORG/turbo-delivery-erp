'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { ActionResult } from '@/types';
import { BonLivraison, ParametreBonLivraisonFacture } from '@/types/bon-livraison.model';
import { PaginatedResponse } from '@/types';
import { formatDate } from '@/utils/date-formate';
import { RangeValue } from '@heroui/react';
import axios from 'axios';
// Configuration
const BASE_URL = '/api/erp/bon-livraison';
const BASE_URL_2 = '/api/export/reporting';

const bonLivraisonEndpoints = {
    getBonLivraisonAll: {
        endpoint: `${BASE_URL}/tous`,
        method: 'GET',
    },
    bonLivraisonTerminers: { endpoint: `${BASE_URL}/tous-termines`, method: 'GET' },
    reportingBonLivraison: { endpoint: `${BASE_URL_2}/facture-bon-livraison`, method: "POST" }
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
        return null;
    }
}


export async function getAllBonLivraisonTerminers(page: number = 0, size: number = 10,
    { dates: { start, end } }: { dates: RangeValue<string | null> }, typeCommsion: string): Promise<BonLivraison[]> {
    try {
        const data = await apiClientHttp.request<BonLivraison[]>({
            endpoint: bonLivraisonEndpoints.bonLivraisonTerminers.endpoint,
            method: bonLivraisonEndpoints.bonLivraisonTerminers.method,
            params: {
                page: page.toString(),
                size: size.toString(),
                debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
                type: typeCommsion
            }
        });
        return data;
    } catch (error) {
        return error as any;
    }
};

export async function reportingBonLivraisonTerminers(parametre: ParametreBonLivraisonFacture): Promise<ArrayBuffer | null> {
    try {
        const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BACKEND_URL}${bonLivraisonEndpoints.reportingBonLivraison.endpoint}`,
            parametre,
            {
                responseType: "arraybuffer",
            }
        );
        return response.data;
    } catch (error) {
        return null;
    }
}



