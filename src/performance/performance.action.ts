'use server';

import { PaginatedResponse } from '@/types';
import { apiClientHttp } from '@/lib/api-client-http';
import { PerformanceCreneauId } from '@/types/performance-creneauId';
import { AxiosError } from 'axios';
import { PerformanceHebdomadaire } from '@/types/performance-hebdomadaire';

// Configuration
const BASE_URL = '/api/erp/performance';  

const creneauEndpoints = {
    base: {
        endpoint: BASE_URL,
        method: 'GET',
    },
 
    getAllPerformaneTurbo: {
        endpoint: `${BASE_URL}/turbo`,
        method: 'GET',
    },

    getAllPerformanceBird: {
        endpoint: `${BASE_URL}/bird`,
        method: 'GET',
    },
    getPerformanceCreneauById: {
        endpoint: (creneauId: string) => `${BASE_URL}/${creneauId}/creneau`,
        method: 'GET',
    },
    getPerformancePlanning: {
        endpoint: (creneauId: string,emploiId:string) => `${BASE_URL}/${creneauId}/planning-hebdomadaire/${emploiId}`,
        method: 'GET',
    },
    getPerformanceFichePaie: {
        endpoint: (creneauId: string,emploiId:string) => `${BASE_URL}/${creneauId}/creneau/${emploiId}`,
        method: 'GET',
    },
};


export async function getAllPerformaneTurbo(page: number = 0, size: number = 10): Promise<PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<LivreurPerformanceBirdEndTorubo>>({
            endpoint: creneauEndpoints.getAllPerformaneTurbo.endpoint,
            method: creneauEndpoints.getAllPerformaneTurbo.method,
            service: 'backend',
            params: {
                page: String(page),
                size: String(size),
            },
        });

        return data;
    } catch (error) {
        // Sans relance, une panne de lecture devenait une page vide et l'ecran
        // "Performance des turboys" annoncait qu'aucun turboy n'etait assigne.
        throw error;
    }
}


export async function getAllPerformanceBird(page: number = 0, size: number = 10): Promise<PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null>({
            endpoint: creneauEndpoints.getAllPerformanceBird.endpoint,
            method: creneauEndpoints.getAllPerformanceBird.method,
            service: 'backend',
            // La fonction DECLARAIT `page` et `size` et ne les envoyait pas : la requete
            // partait sans `params`, le serveur retombait sur son defaut (`size = 5`) et
            // l'onglet « Performance des birds » n'affichait QUE 5 livreurs. Mesure faite
            // en production le 11/09/2026 : 5 lignes rendues pour 9 birds existants, sans
            // pagination a l'ecran ni rien qui signale la suite. Quatre birds etaient donc
            // invisibles, et l'ecran se lisait comme la liste complete.
            // L'appel voisin `getAllPerformaneTurbo` transmettait bien les deux.
            params: {
                page: String(page),
                size: String(size),
            },
        });

        return data;
    } catch (error) {
        // Sans relance, une panne de lecture devenait une liste vide et l'ecran
        // "Performances birds" annoncait qu'aucun livreur n'avait de performance.
        throw error;
    }
}


export async function getPerformanceCreneauById(creneauId: string): Promise<PerformanceCreneauId|null> {
    try {
        const data = await apiClientHttp.request<PerformanceCreneauId|null>({
            endpoint: creneauEndpoints.getPerformanceCreneauById.endpoint(creneauId),
            method: creneauEndpoints.getPerformanceCreneauById.method,
            service: 'backend',
        });
        return data;
    } catch (error: AxiosError | unknown) {
        if (error instanceof AxiosError) {
            // Si l'erreur est une AxiosError, affichez plus de détails sur l'erreur
            // console.error('Error fetching performance creneau by ID:', error.message);
            // console.error('Response:', error.response); // Réponse complète du serveur
            // console.error('Status:', error.response?.status); // Code de statut HTTP
            console.error('Data:', error.response?.data); // Données retournées par le serveur (si disponibles)
        } else {
            // Si c'est une erreur inconnue (non Axios), loggez l'erreur brute
            console.error('Unknown error occurred:', error);
        }
        // Le catch avalait tous les statuts sans jamais tester un 404 : la page
        // performance-apercue affichait "Aucune performance" alors que la lecture
        // du creneau avait echoue.
        throw error;
    }
}


export async function getPerformancePlanning(creneauId: string,emploiId:string): Promise<PerformanceHebdomadaire|null> {
    try {
        const data = await apiClientHttp.request<PerformanceHebdomadaire|null>({
            endpoint: creneauEndpoints.getPerformancePlanning.endpoint(creneauId,emploiId),
            method: creneauEndpoints.getPerformancePlanning.method,
            service: 'backend',
        });
        return data;
    } catch (error: AxiosError | unknown) {
        if (error instanceof AxiosError) {
            // Si l'erreur est une AxiosError, affichez plus de détails sur l'erreur
            // console.error('Error fetching performance creneau by ID:', error.message);
            // console.error('Response:', error.response); // Réponse complète du serveur
            // console.error('Status:', error.response?.status); // Code de statut HTTP
            console.error('Data:', error.response?.data); // Données retournées par le serveur (si disponibles)
        } else {
            // Si c'est une erreur inconnue (non Axios), loggez l'erreur brute
            console.error('Unknown error occurred:', error);
        }
        // Meme diagnostic : la page planning-hebdomadaire affichait "Aucun planning"
        // alors que la lecture du planning avait echoue.
        throw error;
    }
}


export async function getPerformanceFichePaie(creneauId: string,emploiId:string): Promise<PerformanceApercuGlobalGain|null> {
    try {
        const data = await apiClientHttp.request<PerformanceApercuGlobalGain|null>({
            endpoint: creneauEndpoints.getPerformanceFichePaie.endpoint(creneauId,emploiId),
            method: creneauEndpoints.getPerformanceFichePaie.method,
            service: 'backend',
        });
        return data;
    } catch (error: AxiosError | unknown) {
        if (error instanceof AxiosError) {
            // Si l'erreur est une AxiosError, affichez plus de détails sur l'erreur
            // console.error('Error fetching performance creneau by ID:', error.message);
            // console.error('Response:', error.response); // Réponse complète du serveur
            // console.error('Status:', error.response?.status); // Code de statut HTTP
            console.error('Data:', error.response?.data); // Données retournées par le serveur (si disponibles)
        } else {
            // Si c'est une erreur inconnue (non Axios), loggez l'erreur brute
            console.error('Unknown error occurred:', error);
        }
        // La fiche de paie restait vide en cas de panne, sans distinction avec une
        // periode reellement sans gain. L'appelant client table-creneau.tsx avale
        // encore l'erreur dans son useEffect : a reprendre.
        throw error;
    }
}







