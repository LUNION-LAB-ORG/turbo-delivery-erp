export interface BonLivraison {
    commandeId: string;
    reference: string;
    livreur: string;
    restaurant: string;
    coutLivraison: number;
    coutCommande: number;
    commission?: number;
    date: string;
    heure: {
        hour: number;
        minute: number;
        second: number;
        nano: number;
    };
    statut: string;
}

export type FormatsSupportes = "PDF" | "EXCEL" | "HTML";
export type TypeCommission = 'POURCENTAGE' | 'FIXE';

export interface ParametreBonLivraisonFacture {
    restaurantId: string;
    debut?: string;
    fin?: string;
    type?: TypeCommission
    format: FormatsSupportes
}