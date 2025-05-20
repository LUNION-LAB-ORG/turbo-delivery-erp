interface Heure {
    debut: string; // Heure de début au format HH:MM:SS
    fin: string;   // Heure de fin au format HH:MM:SS
    statut: string; // Statut de l'heure
  }
  
  interface Jour {
    jour: string;  // Le jour de la semaine, par exemple "LUNDI"
    debut: string; // Heure de début du travail (au format HH:MM:SS)
    fin: string;   // Heure de fin du travail (au format HH:MM:SS)
    heures: Heure[]; // Liste des heures avec statut
  }
  
  interface PerformanceCreneauHebdomadaire {
    id: string; // Identifiant unique
    heureTravailParCreneau: number; // Nombre d'heures de travail par créneau
    heureArret: number; // Nombre d'heures d'arrêt
    jourManque: number; // Nombre de jours manquants
    jours: Jour[]; // Liste des jours avec les horaires et les heures associées
  }
  

//   PerformanceCreneauHebdomadaire
 
  