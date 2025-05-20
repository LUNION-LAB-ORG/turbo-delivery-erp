export interface BonLivraison {
    commandeId: string;
    reference: string;
    livreur: string;
    restaurant: string;
    coutLivraison: number;
    coutCommande: number;
    date: string;
    heure: {
        hour: number;
        minute: number;
        second: number;
        nano: number;
    };
    statut: string;
}
