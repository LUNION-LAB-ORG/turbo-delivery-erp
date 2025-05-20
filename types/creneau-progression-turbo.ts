interface Jour {
  jourTravaille: number;
  jourNonTravaille: number;
}

interface CreneauVM {
  jourDebut: string; // Format ISO 8601 : YYYY-MM-DD
  jourFin: string;   // Format ISO 8601 : YYYY-MM-DD
}

interface Livreur {
  id: string; // Unique identifier for the delivery person
  nomComplet: string; // Full name of the delivery person
  progression: number; // Progress in some task or metric (percentage or value)
  jour: Jour; // Work and non-work days
  creneauVM: CreneauVM; // Time slot for the delivery person
}

interface RestaurantProgressionTurbo {
  nombreLivreur: number; // Number of delivery persons
  nomRestaurant: string; // Name of the restaurant
  livreurs: Livreur[];   // List of delivery persons
}

















// interface Jour {
//     jourTravaille: number;
//     jourNonTravaille: number;
//   }
  
//   interface CreneauVM {
//     debut: string;
//     fin: string;
//   }
  
//   interface Livreur {
//     id: string;
//     nomComplet: string;
//     progression: number;
//     jour: Jour;
//     creneauVM: CreneauVM;
//   }
  
//   interface RestaurantProgressionTurbo {
//     nombreLivreur: number;
//     nomRestaurant: string;
//     livreurs: Livreur[];
//   }
  
  