export interface TurboysBird {
    id: string;
    nom: string;
    prenom: string;
    DateinscritLe: string; // Format "JJ/MM/AAAA"
    definiLe: string; // Format "JJ/MM/AAAA"
    creneau: string; // Texte décrivant le créneau
    actif: boolean;
  };


  export interface TurboysNotSlot{ 
    id: string, 
    nom: string, 
    inscritLe: string, 
    creeLe: string, 
    statut: string,
  }


  interface Child {
    id: string;
    nom: string;
    prenom: string;
    DateinscritLe: string;  // Date au format 'JJ/MM/AAAA'
    definiLe: string;       // Date au format 'JJ/MM/AAAA'
    creneau: string;       // Plage horaire du créneau
    actif: boolean;         // Statut actif ou non
  };
  
  export interface TurboysAssignes {
    id: string;
    nameRestaurant: string;
    sizeChildren: number;
    img: string;
    children: Child[];
  };
  

  export interface  BirdPerformance  {
    id: string;
    nomComplet: string;
    progression: number;
    jour: {
      jourTravaille: number;
      jourNonTravaille: number;
    };
    creneauVM: {
      debut: string; // format "YYYY-MM-DD"
      fin: string; // format "YYYY-MM-DD"
    };
  };
  



  interface CreneauVM  {
    debut: string;
    fin: string;
  };
  
  interface Jour {
    jourTravaille: number;
    jourNonTravaille: number;
  };
  
  interface Livreur  {
    id: string;
    nomComplet: string;
    progression: number;
    jour: Jour;
    creneauVM: CreneauVM;
  };
  
export  interface RestaurantTuboProgression  {
    nonRestaurant: string;
    livreurs: Livreur[];
  };