import { TurboysBird,TurboysNotSlot } from "@/types/slot"
import Content from "./content"
import { Metadata } from "next";
import { getAllPerformaneTurbo } from "@/src/performance/performance.action";


  // const livreur: LivreurPerformanceBirdEndTorubo[] = [
  //   {
  //     id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  //     avatarUrl: "https://www.example.com/avatar1.png",
  //     nomComplet: "Jean Dupont",
  //     creneau: {
  //       debut: "2025-04-04T09:00:00",
  //       fin: "2025-04-04T17:00:00"
  //     },
  //     etats: [
  //       {
  //         date: "2025-04-04",
  //         jour: "LUNDI",
  //         statut: "VALIDE"
  //       }
  //     ],
  //     performance: 85,
  //     commission: 150,
  //     prime: 200
  //   },
  //   {
  //     id: "4fb86g75-6829-3762-c4hd-9d974g67ghc7",
  //     avatarUrl: "https://www.example.com/avatar2.png",
  //     nomComplet: "Marie Lefevre",
  //     creneau: {
  //       debut: "2025-04-04T10:00:00",
  //       fin: "2025-04-04T18:00:00"
  //     },
  //     etats: [
  //       {
  //         date: "2025-04-04",
  //         jour: "LUNDI",
  //         statut: "VALIDE"
  //       }
  //     ],
  //     performance: 90,
  //     commission: 180,
  //     prime: 220
  //   },
  //   {
  //     id: "2fa45h23-1248-9035-b4df-5c874f95kld4",
  //     avatarUrl: "https://www.example.com/avatar3.png",
  //     nomComplet: "Paul Martin",
  //     creneau: {
  //       debut: "2025-04-04T08:30:00",
  //       fin: "2025-04-04T16:30:00"
  //     },
  //     etats: [
  //       {
  //         date: "2025-04-04",
  //         jour: "LUNDI",
  //         statut: "VALIDE"
  //       }
  //     ],
  //     performance: 75,
  //     commission: 120,
  //     prime: 180
  //   }
  // ];
  
    
  export const metadata: Metadata = {
    title: "Liste des  performance des Turboys Bird ", 
    description: "Liste des performance des Turboys Bird.",
  };


export default async function Page(){
        const response = await getAllPerformaneTurbo();
        
  
    return <Content initialData={response} />

}