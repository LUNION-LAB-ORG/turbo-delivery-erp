export interface NotificationVM {
    id?: string;
    titre?: string;
    message?: string;
    lu?: boolean;
    lien?: string;
    type?: NotificationENum;
    tempsPasse?: string;
}


export enum NotificationENum {
    NOUVELLE_COURSE,
    ACCEPTATION_COURSE,
    ASSIGNATION_COURSE,
    CLOTURE_COURSE,
    COMMANDE,
    ANNULATION_COMMANDE,
    DEMANDE_ASSIGNATION,
    DEMANDE_ASSIGNATION_ACCEPTE,
    DEMANDE_ASSIGNATION_REJETER
}