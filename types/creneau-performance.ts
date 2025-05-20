export interface Creneau {
    debut: string; // Date sous forme de string
    fin: string;   // Date sous forme de string
  }
  
  export interface Etat {
    date: string;  // Date sous forme de string
    jour: string;  // Jour de la semaine (ex : "LUNDI")
    statut: string; // Statut (ex : "VALIDE")
  }
  
  export interface LivreurPerformance {
    id: string;                // ID unique du livreur
    avatarUrl: string;         // URL de l'avatar du livreur
    nomComplet: string;        // Nom complet du livreur
    creneau: Creneau;          // Crénau du livreur (début et fin)
    etats: Etat[];             // Liste des états du livreur (date, jour, statut)
    performance: number;       // Performance du livreur
    commission: number;        // Commission du livreur
    prime: number;             // Prime du livreur
  }
  