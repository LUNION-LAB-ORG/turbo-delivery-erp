export interface DemanderPaieLivreurCommande {
    livreurId: string;
    emploiId: string;
    compteTransfertId?: string
}

type StatutType = "NON DEMARRE" | "EN COURS" | "PAYE" | "REJETE";

type InfosParJourStatutType = "NON_DEMARRE" | "NON_VALIDE" | "VALIDE";
type JourType = "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | "SAMEDI" | "DIMANCHE"



// export interface DetailPaieVM {
//     commission?: number;
//     prime?: number;
//     statut?: StatutType;
//     info?: InfoPrime;
//     infoCourse?: InfoCourseSemaine;
//     creneau?: Creneau;
//     pourcentage?: number;
//     gain?: GainHebdomadaireVm;
// }

// export interface PaieAnterieurVM {
//     id?: string;
//     commission?: number
//     prime?: number
//     statut?: StatutType
//     creneau?: CreneauVM
//     dateHeurePaie?: string;
// }

// export interface CreneauVM {
//     debut?: string
//     fin?: string;
//     emploiId?: string
// }

// export interface InfoPrime {
//     valideSixJour: boolean;
//     valideVendredi: boolean;
//     valideSamedi: boolean;
//     valideDimanche: boolean;
//     cumulValide: boolean;
// }

// export interface Creneau {
//     debut?: string;
//     fin?: string;
// }

export interface GainHebdomadaireVm {
    frais?: number;
    solde?: number;
    gains?: GainParJour[];
}

export type TypeLivreur = "WAITING" | "TURBO" | "FREE"

export interface PaieParLivreur {
    id?: string;
    nomComplet?: string
    type?: TypeLivreur
    total?: number
    gain?: number
    joursTravaille?: InfoParJour[]
    weekEnd?: InfoParJour[]
    taux?: number
    commission?: number
    prime?: number
    statut?: StatutType,
    livreurId?: string;
    emploiId?: string;
}

export interface PaieErpVM {
    total?: number
    paies?: PaieParLivreur[]
}

export interface FichePaieDetailVM {
    nomPrenom?: string
    totalRealise?: number
    gainInitial?: number
    commission?: number
    prime?: number
    lieuTravail?: string
    statut?: StatutType
    gainFicheVM?: GainHebdomadaireVm,

}

export type TypeStatutStatistique = "PASSE" | "EN_COURS" | "A_VENIR"

export interface StatistiqueMoisPaieVM {
    jour?: number
    statut?: TypeStatutStatistique
}

export interface GainParJour {
    date?: string;
    jour?: JourType
    gain?: GainParDateVm
}

export interface GainParDateVm {
    frais?: number;
    solde?: number;
    gains?: GainVm[];
}

export interface GainVm {
    code?: string;
    frais?: number;
    commission?: number;
    date?: string;
}

export interface InfoParJour {
    jour?: JourType
    statut?: InfosParJourStatutType
}

export interface InfoCourseSemaine {
    lundi?: InfoParJour
    mardi?: InfoParJour
    mercredi?: InfoParJour
    jeudi?: InfoParJour
    vendredi?: InfoParJour
    samedi?: InfoParJour
    dimanche?: InfoParJour
}
