'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { FichePaieDetailVM, GainParJour, PaieErpVM, StatistiqueMoisPaieVM } from '@/types/gestion-de-paie.model';
import { formatDate } from "@/utils/date-formate";

const BASE_URL = '/api/erp';

const gestionPaieEndpoints = {
    fichePaies: { endpoint: `${BASE_URL}/fiche-paie`, method: 'GET' },
    getFichePaieById: { endpoint: (fichePaieId: string) => `${BASE_URL}/fiche-paie/${fichePaieId}`, method: "GET" },
    getGainParJour: { endpoint: (fichePaieId: string) => `${BASE_URL}/fiche-paie/${fichePaieId}/gain`, method: "GET" },
    getStatistiqueFichePaie: { endpoint: `${BASE_URL}/fiche-paie/statistique`, method: "GET" },
    getFicheByEmploiAndLivreur: { endpoint: (emploiId: string, livreurId: string) => `${BASE_URL}/fiche-paie/${livreurId}/creneau/${emploiId}`, method: "GET" }
};

export async function getFicheDePaies(start: Date | null, end: Date | null): Promise<PaieErpVM | null> {
    try {

        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.fichePaies.endpoint,
            method: gestionPaieEndpoints.fichePaies.method,
            service: 'backend',
            params: {
                debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
                fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
            }
        });

        return data;
    } catch (error: any) {
        return null;
    }
}

export async function getFichePaieById(fichePaieId: string): Promise<FichePaieDetailVM | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getFichePaieById.endpoint(fichePaieId),
            method: gestionPaieEndpoints.getFichePaieById.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        console.log("error+++++++++++++++++20", error)
        return null;
    }
};

export async function getFichePaieByEmploiAndLivreur(emploiId: string, livreurId: string): Promise<FichePaieDetailVM | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getFicheByEmploiAndLivreur.endpoint(emploiId, livreurId),
            method: gestionPaieEndpoints.getFicheByEmploiAndLivreur.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        console.log("error+++++++++++++++++20", error)
        return null;
    }
};

export async function getGainParJour(fichePaieId: string): Promise<GainParJour | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getGainParJour.endpoint(fichePaieId),
            method: gestionPaieEndpoints.getGainParJour.method,
            service: 'backend',
        });
        return data;
    } catch (error: any) {
        return null;
    }
};

export async function getStatistiqueFichePaie(mois: string, annees: string): Promise<StatistiqueMoisPaieVM | null> {
    try {
        const data = await apiClientHttp.request({
            endpoint: gestionPaieEndpoints.getStatistiqueFichePaie.endpoint,
            method: gestionPaieEndpoints.getStatistiqueFichePaie.method,
            service: 'backend',
            params: {
                mois: mois,
                annee: annees
            }
        });
        return data;
    } catch (error: any) {
        return null;
    }
}
