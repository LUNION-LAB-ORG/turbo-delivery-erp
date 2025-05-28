'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { FileAttenteStatistiqueVM, FilleAttenteHistoriqueVM } from '@/types/file-attente.model';

const BASE_URL = '/api/erp/file-attente';

const fileAttenteEndpoints = {
    fetchFilleAttente: { endpoint: `${BASE_URL}/historique`, method: 'GET' },
    statistiqueFileAttente: { endpoint: `${BASE_URL}/statistique`, method: "GET" }
};


export async function fetchFilleAttente(): Promise<FilleAttenteHistoriqueVM[]> {
    try {
        const data = await apiClientHttp.request<FilleAttenteHistoriqueVM[]>({
            endpoint: fileAttenteEndpoints.fetchFilleAttente.endpoint,
            method: fileAttenteEndpoints.fetchFilleAttente.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        return [];
    }
}

export async function fetchStatistiqueFilleAttente(): Promise<FileAttenteStatistiqueVM | null> {
    try {
        const data = await apiClientHttp.request<FileAttenteStatistiqueVM>({
            endpoint: fileAttenteEndpoints.statistiqueFileAttente.endpoint,
            method: fileAttenteEndpoints.statistiqueFileAttente.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        return null;
    }
}
