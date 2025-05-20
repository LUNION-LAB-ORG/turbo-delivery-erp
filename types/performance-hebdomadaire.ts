export type StatutHeure = "NON_DEMARRE" | "TRAVAILLE" | "HORS_SERVICE" | "ABSENT";

export interface Heure {
    debut: string; // Heure de début au format HH:MM:SS
    fin: string;   // Heure de fin au format HH:MM:SS
    statut: StatutHeure; // Statut de l'heure
  }
  
  export interface Jour {
    date:string;
    jour: string;  // Le jour de la semaine, par exemple "LUNDI"
    debut: string; // Heure de début du travail (au format HH:MM:SS)
    fin: string;   // Heure de fin du travail (au format HH:MM:SS)
    heures: Heure[]; // Liste des heures avec statut
  }
  export interface CreneauVM{
    debut:string,
    fin:string,
    emploiId:string

  }
  
  export interface PerformanceHebdomadaire {
    id: string; // Identifiant unique
    heureTravailParCreneau: number; // Nombre d'heures de travail par créneau
    heureArret: number; // Nombre d'heures d'arrêt
    jourManque: number; // Nombre de jours manquants
    creneauVM:CreneauVM;
    jours: Jour[]; // Liste des jours avec les horaires et les heures associées
  }



  export const columns = [
    { key: "04", label: "04:00" },
    { key: "05", label: "05:00" },
    { key: "06", label: "06:00" },
    { key: "07", label: "07:00" },
    { key: "08", label: "08:00" },
    { key: "09", label: "09:00" },
    { key: "10", label: "10:00" },
    { key: "11", label: "11:00" },
    { key: "12", label: "12:00" },
    { key: "13", label: "13:00" },
    { key: "14", label: "14:00" },
    { key: "15", label: "15:00" },
    { key: "16", label: "16:00" },
    { key: "17", label: "17:00" },
    { key: "18", label: "18:00" },
    { key: "19", label: "19:00" },
    { key: "20", label: "20:00" },
    { key: "21", label: "21:00" },
    { key: "22", label: "22:00" },
    { key: "23", label: "23:00" },
    { key: "00", label: "00:00" },
  ] as const;
  
  export type HourKey = (typeof columns)[number]["key"];
  
  
