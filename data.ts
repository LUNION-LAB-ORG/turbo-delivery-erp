export const ROUTE_COLORS = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEEAD',
    '#D4A5A5',
    '#9B59B6',
    '#3498DB',
    '#1ABC9C',
    '#F1C40F',
    '#E74C3C',
    '#2ECC71',
    '#34495E',
    '#16A085',
    '#F39C12',
    '#8E44AD',
    '#2980B9',
    '#27AE60',
    '#D35400',
    '#C0392B',
];

export const courses_statuses_filters = [
    {
        id: 'all',
        name: 'Toutes les courses',
    },
    {
        id: 'EN_ATTENTE',
        name: 'En attente',
    },
    {
        id: 'VALIDER',
        name: 'Validées',
    },
    {
        id: 'EN_COURS',
        name: 'En cours',
    },
    {
        id: 'TERMINER',
        name: 'Terminées',
    },
    {
        id: 'ANNULER',
        name: 'Annulées',
    },
];

export const COURSES_STATUSES = {
    EN_ATTENTE: 'EN_ATTENTE',
    EN_COURS: 'EN_COURS',
    TERMINE: 'TERMINER',
    ANNULE: 'ANNULER',
    VALIDER: 'VALIDER',
};

export const COMMANDES_STATUSES = {
    EN_ATTENTE_RECUPERATION: 'EN_ATTENTE_RECUPERATION',
    ANNULER: 'ANNULER',
    RECUPERER: 'RECUPERER',
    EN_COURS_LIVRAISON: 'EN_COURS_LIVRAISON',
    EN_ATTENTE_VERSEMENT: 'EN_ATTENTE_VERSEMENT',
    TERMINER: 'TERMINER',
};


export const SORT_OPTIONS = {
    DATE_DESC: 'date_desc',
    DATE_ASC: 'date_asc',
    TOTAL_DESC: 'total_desc',
    TOTAL_ASC: 'total_asc',
} as const;


export const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }]
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }]
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }]
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }]
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }]
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }]
    },
    {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
    }
];


export const colorMap: Record<string, string> = {
    A: "bg-red-500",
    B: "bg-blue-500",
    C: "bg-green-500",
    D: "bg-yellow-500",
    E: "bg-purple-500",
    F: "bg-pink-500",
    G: "bg-indigo-500",
    H: "bg-teal-500",
    I: "bg-orange-500",
    J: "bg-lime-500",
    K: "bg-cyan-500",
    L: "bg-emerald-500",
    M: "bg-rose-500",
    N: "bg-gray-500",
    O: "bg-blue-700",
    P: "bg-green-700",
    Q: "bg-yellow-700",
    R: "bg-purple-700",
    S: "bg-pink-700",
    T: "bg-indigo-700",
    U: "bg-teal-700",
    V: "bg-orange-700",
    W: "bg-lime-700",
    X: "bg-cyan-700",
    Y: "bg-emerald-700",
    Z: "bg-rose-700",
};