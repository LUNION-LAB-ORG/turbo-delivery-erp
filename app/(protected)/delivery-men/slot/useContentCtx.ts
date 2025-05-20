'use client';

import { useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { LivreurBird } from '@/types/creneau-bird';
import { Restaurant } from '@/types/creneau-turbo';
import { useSearchParams } from 'next/navigation';

interface props {
  initialData: PaginatedResponse<LivreurBird> | null;
}

// const dataa:LivreurBird[] = [
//   {
//     id: "1a2b3c4d-5678-9101-1121-314151617181",
//     nomComplet: "Pierre Dupont",
//     dateInscrit: "2025-03-15",
//     dateDefiniEmploiTemps: "2025-04-01",
//     jour: {
//       jourTravaille: 5, // Vendredi
//       jourNonTravaille: 2 // Mardi
//     },
//     creneauVM: {
//       jourDebut: "2025-04-07T08:00:00",
//       jourFin: "2025-04-07T12:00:00"
//     },
//     creneauIndisponible: "2025-04-07T14:00:00",
//     dateNonDefini: "2025-04-05",
//     disponibilite: true,
//     disponibiliteCreneau: true
//   },
//   {
//     id: "2a3b4c5d-6789-1021-3141-516171819202",
//     nomComplet: "Marie Martin",
//     dateInscrit: "2025-01-22",
//     dateDefiniEmploiTemps: "2025-03-10",
//     jour: {
//       jourTravaille: 1, // Lundi
//       jourNonTravaille: 6 // Samedi
//     },
//     creneauVM: {
//       jourDebut: "2025-04-07T09:00:00",
//       jourFin: "2025-04-07T13:00:00"
//     },
//     creneauIndisponible: "2025-04-07T15:00:00",
//     dateNonDefini: "2025-04-05",
//     disponibilite: false,
//     disponibiliteCreneau: false
//   },
//   {
//     id: "3a4b5c6d-7890-1234-5678-910111213141",
//     nomComplet: "Lucas Leblanc",
//     dateInscrit: "2025-02-10",
//     dateDefiniEmploiTemps: "2025-04-03",
//     jour: {
//       jourTravaille: 3, // Mercredi
//       jourNonTravaille: 4 // Jeudi
//     },
//     creneauVM: {
//       jourDebut: "2025-04-08T10:00:00",
//       jourFin: "2025-04-08T14:00:00"
//     },
//     creneauIndisponible: "2025-04-08T16:00:00",
//     dateNonDefini: "2025-04-06",
//     disponibilite: true,
//     disponibiliteCreneau: true
//   }
// ];


export default function useContentCtx({ initialData }: props) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState<string | null>(null);
  const textParam = searchParams.get('text');
  const [initialBirdCreneau, setInitialBirdCreneau] = useState<LivreurBird[]>([]);
  const [birdCreneau, setBirdCreneau] = useState<LivreurBird[]>([]);
  const [initialBirdNotCreneau, setInitialBirdNotCreneau] = useState<LivreurBird[]>([]);
  const [birdNotCreneau, setBirdNotCreneau] = useState<LivreurBird[]>([]);

  // const [data, setData] = useState<LivreurBird[] | []>(initialData?.content || []);

  function filterBirdCreneau() {
    let data;
    if (initialData?.content) data = initialData.content.filter((item) => item.disponibiliteCreneau);
    
    setInitialBirdCreneau(data || []);
  }

  function filterBirdNotCreneau() {
    let data;
    if (initialData?.content) data = initialData.content.filter((item) => !item.disponibiliteCreneau);
    
    setInitialBirdNotCreneau(data || []);
  }

  useEffect(() => {
    filterBirdCreneau();
    filterBirdNotCreneau()
  }, []);



  //filtrer bird qui ont un creneau 
  useEffect(() => {
    // Initialiser search à partir de textParam
    setSearch(textParam);

    // Si search n'est pas vide, filtrer les données
    if (search !== null && search.trim() !== '') {
      const filtered = initialBirdCreneau.filter((item) => item.nomComplet.toLowerCase().includes(search.toLowerCase())) || [];
      setBirdCreneau(filtered);
    } else {
      // Si search est vide, restaurer la liste initiale
      setBirdCreneau(initialBirdCreneau || []);
    }
  }, [search, textParam, initialBirdCreneau]);

    //filtrer bird qui n'ont pas de creneau 
  useEffect(() => {
    // Initialiser search à partir de textParam
    setSearch(textParam);

    // Si search n'est pas vide, filtrer les données
    if (search !== null && search.trim() !== '') {
      const filtered = initialBirdNotCreneau.filter((item) => item.nomComplet.toLowerCase().includes(search.toLowerCase())) || [];
      setBirdNotCreneau(filtered);
    } else {
      // Si search est vide, restaurer la liste initiale
      setBirdNotCreneau(initialBirdNotCreneau || []);
    }
  }, [search, textParam, initialBirdNotCreneau]);


  return {
    birdCreneau,
    birdNotCreneau
  };
}
