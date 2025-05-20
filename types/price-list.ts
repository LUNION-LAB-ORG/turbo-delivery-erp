export interface DeliveryFee {
    name?:string
    id?: string;
    zone: string;
    restaurantId?: string;
    longitude?: number;
    latitude?: number;
    distanceDebut: number;
    distanceFin: number;
    prix: number;
    commission: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface RestaurantDefini {
    id: string;
    idLocation: string;
    logo: string;
    logo_Url: string;
    nomEtablissement: string;
    longitude: number;
    latitude: number;
    typeCommission: 'POURCENTAGE' | 'FIXE';
    commission: number;
    position: {
        longitude: number;
        latitude: number;
    };
}


