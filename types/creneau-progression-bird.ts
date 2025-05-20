interface Jour {
    jourTravaille: number;  // Nombre de jours travaillés
    jourNonTravaille: number;  // Nombre de jours non travaillés
  }
  
  interface CreneauVM {
    jourDebut: string;  // Date de début du créneau (format ISO 8601 : YYYY-MM-DD)
    jourFin: string;    // Date de fin du créneau (format ISO 8601 : YYYY-MM-DD)
  }
  
  interface CreneauProgressionBird {
    id: string;  // Identifiant unique du livreur
    nomComplet: string;  // Nom complet du livreur
    progression: number;  // Progression du livreur (ex : pourcentage)
    jour: Jour;  // Informations sur les jours travaillés et non travaillés
    creneauVM: CreneauVM;  // Informations sur le créneau horaire du livreur
  }
  