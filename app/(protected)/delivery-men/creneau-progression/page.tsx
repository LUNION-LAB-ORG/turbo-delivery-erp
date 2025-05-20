import { BirdPerformance, TurboysBird,TurboysNotSlot } from "@/types/slot"
import Content from "./content"
import { Metadata } from "next";
import { getAllCreneauPerformanceBird } from "@/src/creneau-livreur/creneau-livreur.action";

const bird = [
  {
    id: "1a2b3c4d-1234-5678-9101-abcdefabcdef",
    nomComplet: "Jean Dupont",
    progression: 75,
    jour: {
      jourTravaille: 15,
      jourNonTravaille: 5
    },
    creneauVM: {
      debut: "2025-04-01",
      fin: "2025-04-15"
    }
  },
  {
    id: "1a2b3c1d-1234-5678-9101-abcdefabcdef",
    nomComplet: "Jean Dupont",
    progression: 65,
    jour: {
      jourTravaille: 5,
      jourNonTravaille: 2
    },
    creneauVM: {
      debut: "2025-04-11",
      fin: "2025-04-15"
    }
  },
  {
    id: "1a2b3c1d-1234-5678-9109-abcdefabcdef",
    nomComplet: "Jean Dupont",
    progression: 50,
    jour: {
      jourTravaille: 5,
      jourNonTravaille: 2
    },
    creneauVM: {
      debut: "2025-04-11",
      fin: "2025-04-16"
    }
  },
  
 
];
  export const metadata: Metadata = {
    title: "Progression des Turboys assignes ",
    description: "Liste des activités des Turboys assignes.",
  };


export default async function Page(){

    // const initialData: BirdPerformance[] = bird 
    const initialData = await getAllCreneauPerformanceBird()

    return <Content initialData={initialData} />

}