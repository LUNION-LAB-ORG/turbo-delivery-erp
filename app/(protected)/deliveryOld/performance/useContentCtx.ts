'use client';

import { useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { useSearchParams } from 'next/navigation';

interface props {
  initialData: PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null;
}

// const livreur: LivreurPerformanceBirdEndTorubo[] =[
//   {
//     id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//     avatarUrl: "https://www.example.com/avatar1.png",
//     nomComplet: "Jean Dupont",
//     creneau: {
//       debut: "2025-03-31",
//       fin: "2025-04-06",
//       emploiId:"206337d9-c5f9-43a9-b778-74f35069c13e",
//     },
//     etats: [
//       { date: "2025-03-31", jour: "LUNDI", statut: "VALIDE" },
//       { date: "2025-04-01", jour: "MARDI", statut: "MANQUE" },
//       { date: "2025-04-02", jour: "MERCREDI", statut: "VALIDE" },
//       { date: "2025-04-03", jour: "JEUDI", statut: "MANQUE" },
//       { date: "2025-04-04", jour: "VENDREDI", statut: "VALIDE" },
//       { date: "2025-04-05", jour: "SAMEDI", statut: "NON_DEMARRE" },
//       { date: "2025-04-06", jour: "DIMANCHE", statut: "NON_DEMARRE" }
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
//       debut: "2025-03-28",
//       fin: "2025-03-28",
//       emploiId:"206337d9-c5f9-43a9-b778-74f35069c13e",

//     },
//     etats: [
//       { date: "2025-03-28", jour: "VENDREDI", statut: "VALIDE" }
//     ],
//     performance: 20,
//     commission: 80,
//     prime: 70
//   },
//   {
//     id: "2fa45h23-1248-9035-b4df-5c874f95kld4",
//     avatarUrl: "https://www.example.com/avatar3.png",
//     nomComplet: "Paul Martin",
//     creneau: {
//       debut: "2025-04-02",
//       fin: "2025-04-02",
//       emploiId:"206337d9-c5f9-43a9-b778-74f35069c13e",

//     },
//     etats: [
//       { date: "2025-04-02", jour: "MERCREDI", statut: "VALIDE" }
//     ],
//     performance: 55,
//     commission: 120,
//     prime: 180
//   },
//   {
//     id: "a8b61h49-6123-9876-z3kq-4w978s45cgd9",
//     avatarUrl: "https://www.example.com/avatar4.png",
//     nomComplet: "Alice Bernard",
//     creneau: {
//       debut: "2025-03-30",
//       fin: "2025-03-30",
//       emploiId:"206337d9-c5f9-43a9-b778-74f35069c13e",

//     },
//     etats: [
//       { date: "2025-03-30", jour: "DIMANCHE", statut: "VALIDE" }
//     ],
//     performance: 80,
//     commission: 140,
//     prime: 210
//   },
//   {
//     id: "c9d70f22-3789-4507-b6bf-7c298n90tdi0",
//     avatarUrl: "https://www.example.com/avatar5.png",
//     nomComplet: "Lucie Dupuis",
//     creneau: {
//       debut: "2025-04-03",
//       fin: "2025-04-03",
//       emploiId:"206337d9-c5f9-43a9-b778-74f35069c13e",

//     },
//     etats: [
//       { date: "2025-04-03", jour: "JEUDI", statut: "VALIDE" }
//     ],
//     performance: 100,
//     commission: 330,
//     prime: 390
//   }
// ];




export default function useContentCtx({ initialData }: props) {
  const [data, setData] = useState<LivreurPerformanceBirdEndTorubo[]>(initialData?.content||[]);


  useEffect(()=>{
      // Fonction pour calculer le début et la fin de la semaine actuelle
function getWeekDateRange() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // Dimanche = 0, Lundi = 1, etc.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Début de la semaine (lundi)

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Fin de la semaine (dimanche)

  return { start: startOfWeek, end: endOfWeek };
}

// Fonction pour vérifier si une date est dans la plage de la semaine actuelle
function isInCurrentWeek(dateStr:any) {
  const { start, end } = getWeekDateRange();
  const date = new Date(dateStr);
  return date >= start && date <= end;
}

// Filtrer les items qui ont un créneau dans la semaine actuelle
const currentWeekItems = initialData?.content.filter(item => 
  isInCurrentWeek(item.creneau.debut) || isInCurrentWeek(item.creneau.fin)
);

console.log({dd:currentWeekItems});

  },[])


  return {
    data,
    
  };
}
