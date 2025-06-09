export interface TypeCuisine {
    // Définissez les propriétés de type cuisine ici, par exemple :
    // id: string;
    // nom: string;
}

export interface Role {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    libelle: string;
}

export interface User {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    nom: string;
    prenoms: string;
    image: string;
    username: string;
    email: string;
    changePassword: boolean;
    attemptLogin: number;
    passwordExpired: string;
    dateOfInactivity: string;
    role: Role;
}

export interface Restaurant {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    nomEtablissement: string;
    description: string;
    email: string;
    telephone: string;
    codePostal: string;
    commune: string;
    localisation: string;
    siteWeb: string | null;
    logo: string;
    logo_Url: string;
    dateService: string;
    documentUrl: string;
    cni: string;
    longitude: number | null;
    latitude: number | null;
    idLocation: string | null;
    pictures: Picture[];
    openingHours: OpeningHour[];
    position?: {
        longitude: number;
        latitude: number;
    };
    typeCommission: string;
    commission: number;

}
export interface Picture {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    pictureUrl: string;
}

export interface OpeningHour {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    dayOfWeek: string;
    openingTime: string;
    closingTime: string;
    closed: boolean;
}

export interface DeliveryMan {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    nom: string | null;
    prenoms: string | null;
    avatarUrl: string | null;
    telephone: string;
    email: string | null;
    birthDay: string | null;
    gender: string | null;
    cniUrlR: string | null;
    cniUrlV: string | null;
    category: string | null;
    habitation: string | null;
    immatriculation: string | null;
    numeroCni: string | null;
    matricule: string;
}

export interface Collection {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    libelle: string;
    description: string;
    picture: string;
    pictureUrl: string;
}

export interface FindOneRestaurant {
    typecuisine: string[];
    restaurant: Restaurant;
}
export interface Ingredient {
    name: string;
    quantity?: string;
}

export interface Accompaniment {
    id: string;
    libelle: string;
    price: number;
    platId?: string;
}

export interface OptionValue {
    id: string;
    valeur: string;
    prixSup: number;
    optionId?: string;
}

export interface Option {
    id: string;
    libelle: string;
    isRequired: boolean;
    maxSelected: number;
    optionValeurs: OptionValue[];
}

export interface Drink {
    id: string;
    label: string;
    price: number;
    volume: string;
    platId?: string;
}

export interface Dish {
    id: string;
    status: number;
    deleted: boolean;
    dateCreation: string;
    dateEdition: string;
    libelle: string;
    description: string;
    disponible: boolean;
    cookTime: string;
    price: number;
    imageUrl: string;
    restaurant: Restaurant;
    collection: Collection;
}

export interface CollectionWithDishes {
    collectionModel: Collection;
    totalPlat: number;
}

export interface DishComplet {
    platM: Dish;
    accompagnementM: Accompaniment[];
    optionPlatM: Option[];
    boissonPlatMs: Drink[];
}

export interface LocationCourseExterne {
    longitude: number;
    latitude: number;
    address: string;
}

export interface DestinataireCourseExterne {
    nomComplet: string;
    contact: string;
}

export interface CommandeCourseExterne {
    id: string;
    libelle: string;
    numero: string;
    dateHeure?: string;
    destinataire: DestinataireCourseExterne;
    lieuRecuperation: Partial<LocationCourseExterne>;
    lieuLivraison: Partial<LocationCourseExterne>;
    modePaiement: string;
    statut: string;
    fraisLivraison: number;
    prix: number;
    livraisonPaye: boolean;
}
export interface CourseExterne {
    id: string;
    code: string;
    statut: string;
    dateHeureDebut: string;
    dateHeureFin: string;
    restaurant: Partial<Restaurant>;
    nombreCommande: number;
    total: number;
    commandes: CommandeCourseExterne[];
}

export interface LivreurDisponible {
    livreurId: string;
    avatarUrl: string;
    nomComplet: string;
    telephone: string;
    position: {
        longitude: number;
        latitude: number;
    };
    course?: CourseExterne;
}

export interface DemandeAssignationVM {
    id?: string;
    nomComplet?: string;
    statutDemandeAssignation?: StatutDemandeAssignationEnum
    type?: string;
    date?: string;
}

export interface ValiderDemandeAssignationCommande {
    demandeAssignationId: string
    restaurantId?: string;
}

export interface LivreurStatutVM {
    livreurId?: string;
    nomPrenom?: string;
    telephone?: string;
    status?: number;
    type?: string;
    restaurantLibelle?: string;
    dateInscription?: string;
}

export interface ChangerStatutLivreurCommande {
    typeLivreur: string;
    livreurId: string;
    restaurantId?: string;

}

export interface ChangerRestaurantLivreurCommande {
    livreurId: string;
    restaurantId: string;
}

export enum StatutDemandeAssignationEnum {
    EN_ATTENTE = "EN_ATTENTE", VALIDE = "VALIDE", REJETER = "REJETER"
}

export enum TypeEnum {
    WAITING, TURBO, FREE
}