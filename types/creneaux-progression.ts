// Interface pour le créneau
export interface Creneau {
    debut: string; // La date de début du créneau
    fin: string;   // La date de fin du créneau
  }
  
  // Interface pour le jour travaillé
  export interface JourTravaille {
    jourTravaille: number; // Le nombre de jours travaillés
    jourNonTravaille: number; // Le nombre de jours non travaillés
  }
  
  // Interface pour le livreur
  export interface Livreur {
    id: string;              // ID unique du livreur
    nomComplet: string;      // Le nom complet du livreur
    progression: number;     // Progression du livreur (ex: en % ou autre)
    jour: JourTravaille;     // Les jours de travail du livreur
    creneauVM: Creneau;      // Les créneaux de travail du livreur
  }
  
  // Interface pour le restaurant
  export interface CreneauxRestaurantProgression {
    nombreLivreur: number;  // Nombre de livreurs associés au restaurant
    nomRestaurant: string;  // Nom du restaurant
    livreurs: Livreur[];    // Liste des livreurs associés au restaurant
  }
  
  // L'interface pour la réponse paginée
  export interface PaginatedResponse<T> {
    content: T[];           // Les données de contenu (ici, des restaurants)
    pageable: Pageable;     // Informations de pagination
    totalPages: number;     // Nombre total de pages
    totalElements: number;  // Nombre total d'éléments
    last: boolean;          // Si c'est la dernière page
    first: boolean;         // Si c'est la première page
    size: number;           // Nombre d'éléments par page
    number: number;         // Numéro de la page actuelle
    sort: Sort;             // Informations sur le tri
    numberOfElements: number; // Nombre d'éléments dans la page actuelle
    empty: boolean;         // Si la page est vide
  }
  
  // Interface pour la pagination
  export interface Pageable {
    paged: boolean;         // Si la pagination est activée
    pageNumber: number;     // Numéro de la page actuelle
    pageSize: number;       // Taille de la page (nombre d'éléments par page)
    offset: number;         // Offset pour le calcul de la pagination
    sort: Sort;             // Informations sur le tri
    unpaged: boolean;       // Si la pagination est désactivée
  }
  
  // Interface pour le tri
  export interface Sort {
    sorted: boolean;        // Si les résultats sont triés
    empty: boolean;         // Si le tri est vide
    unsorted: boolean;      // Si le tri est non trié
  }
  