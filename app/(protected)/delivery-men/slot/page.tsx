import { TurboysBird,TurboysNotSlot } from "@/types/slot"
import Content from "./content"
import { Metadata } from "next";
import { getAllCreneauBird } from "@/src/creneau-livreur/creneau-livreur.action";

const data1=[
    { 
      "id": "1", 
      "nom": "YAO", 
      "prenom": "JUDICAËL", 
      "DateinscritLe": "13/03/2024", 
      "definiLe": "24/03/2024", 
      "creneau": "Créneau 12-22 Fév (5/7 jours)", 
      "actif": true 
    },
    { 
      "id": "2", 
      "nom": "DIALLO", 
      "prenom": "FATIMATA", 
      "DateinscritLe": "15/03/2024", 
      "definiLe": "25/03/2024", 
      "creneau": "Créneau 1-10 Mars (4/7 jours)", 
      "actif": true 
    },
    { 
      "id": "3", 
      "nom": "KONE", 
      "prenom": "MAMADOU", 
      "DateinscritLe": "18/03/2024", 
      "definiLe": "26/03/2024", 
      "creneau": "Créneau 5-15 Avril (3/7 jours)", 
      "actif": false 
    },
    { 
      "id": "4", 
      "nom": "OUEDRAOGO", 
      "prenom": "SALIF", 
      "DateinscritLe": "20/03/2024", 
      "definiLe": "28/03/2024", 
      "creneau": "Créneau 10-20 Mai (6/7 jours)", 
      "actif": true 
    },
    { 
      "id": "5", 
      "nom": "TRAORE", 
      "prenom": "AISSA", 
      "DateinscritLe": "22/03/2024", 
      "definiLe": "30/03/2024", 
      "creneau": "Créneau 2-12 Juin (4/7 jours)", 
      "actif": false 
    },
    { 
      "id": "6", 
      "nom": "N'DIAYE", 
      "prenom": "KHALIL", 
      "DateinscritLe": "25/03/2024", 
      "definiLe": "01/04/2024", 
      "creneau": "Créneau 15-25 Juillet (5/7 jours)", 
      "actif": true 
    },
    { 
      "id": "7", 
      "nom": "ZONGO", 
      "prenom": "MARIE", 
      "DateinscritLe": "28/03/2024", 
      "definiLe": "05/04/2024", 
      "creneau": "Créneau 5-15 Août (3/7 jours)", 
      "actif": true 
    },
    { 
      "id": "8", 
      "nom": "DIABY", 
      "prenom": "MOUSSA", 
      "DateinscritLe": "30/03/2024", 
      "definiLe": "08/04/2024", 
      "creneau": "Créneau 20-30 Sept (6/7 jours)", 
      "actif": false 
    },
    { 
      "id": "9", 
      "nom": "KAMARA", 
      "prenom": "SIRADOU", 
      "DateinscritLe": "02/04/2024", 
      "definiLe": "10/04/2024", 
      "creneau": "Créneau 1-10 Oct (4/7 jours)", 
      "actif": true 
    },
    { 
      "id": "10", 
      "nom": "TANDIA", 
      "prenom": "MARIAM", 
      "DateinscritLe": "05/04/2024", 
      "definiLe": "12/04/2024", 
      "creneau": "Créneau 15-25 Nov (3/7 jours)", 
      "actif": true 
    },
    { 
      "id": "11", 
      "nom": "COULIBALY", 
      "prenom": "ADAMA", 
      "DateinscritLe": "07/04/2024", 
      "definiLe": "14/04/2024", 
      "creneau": "Créneau 5-15 Déc (5/7 jours)", 
      "actif": false 
    },
    { 
      "id": "12", 
      "nom": "SYLLA", 
      "prenom": "HADJA", 
      "DateinscritLe": "10/04/2024", 
      "definiLe": "18/04/2024", 
      "creneau": "Créneau 10-20 Janv (6/7 jours)", 
      "actif": true 
    }
  ]

  const data2=[
        { 
          id: "10", 
          nom: "kouadio Mermoz", 
          inscritLe: "13/03/2024", 
          creeLe: "N/A", 
          statut: "Pas encore défini"
        },
        { 
          id: "11", 
          nom: "Mermoz", 
          inscritLe: "13/03/2024", 
          creeLe: "N/A", 
          statut: "Pas encore défini"
        },
        { 
          id: "12", 
          nom: "Béranger", 
          inscritLe: "13/03/2024", 
          creeLe: "N/A", 
          statut: "Pas encore défini"
        },
        { 
          id: "13", 
          nom: "JUDICAËL YAO", 
          inscritLe: "13/03/2024", 
          creeLe: "N/A", 
          statut: "Pas encore défini"
        }
  ]

  
  
  export const metadata: Metadata = {
    title: "Liste des Turboys Bird ", 
    description: "Liste Turboys Bird.",
  };


export default async function Page(){
        const response = await getAllCreneauBird();
        
  
    return <Content initialData={response} />

}