export interface FilleAttenteHistoriqueVM {
    restaurantId?: string
    restaurant?: string
    fileAttentes?: FilleAttenteVM[]
}

export interface FilleAttenteVM {
    id?: string
    avatar?: string;
    nomComplet?: string;
    position?: number;
    dateJour?: string;
    heureJour?: ILocalDataTime
    statut: string;
}

interface ILocalDataTime {
    hour?: number;
    minute?: number;
    second?: number;
    nano?: number;
}

export interface FileAttenteStatistiqueVM {
    coursier?: number;
    restaurant?: number;
    commandeEnAttente?: number;
    commandeTermine?: number;
}

