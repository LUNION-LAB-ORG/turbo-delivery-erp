'use client';

import { useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/creneau-turbo';
import { useSearchParams } from 'next/navigation';

interface props {
  initialData: PaginatedResponse<Restaurant> | null;
}

// const dataFetch:Restaurant[] = [
//   {
//     nombreLivreur: 4,
//     nomRestaurant: 'JOSE FOOD',
//     livreurs: [
//       {
//         id: null,
//         avatar: 'bf8a509b-4a42-4105-808c-a2d1b9a43d83.jpg',
//         nomComplet: 'AHETO Da Yawa Livlic',
//         dateInscrit: '2025-04-01',
//         dateDefiniEmploiTemps: null,
//         jour: null,
//         creneauVM: null,
//         creneauIndisponible: 'Pas encore defini',
//         dateNonDefini: 'N/A',
//         disponibilite: true,
//         disponibiliteCreneau: true,
//       },
//       {
//         id: null,
//         avatar: '099be41d-859c-45a4-990d-9ef18a1e3749.jpg',
//         nomComplet: 'Djeuré  Yannick',
//         dateInscrit: '2025-04-10',
//         dateDefiniEmploiTemps: null,
//         jour: null,
//         creneauVM: null,
//         creneauIndisponible: 'Pas encore defini',
//         dateNonDefini: 'N/A',
//         disponibilite: true,
//         disponibiliteCreneau: true,
//       },
//       {
//         id: null,
//         avatar: 'cc99aae4-03f9-4b3d-ac4f-1b07d0a13f99.jpg',
//         nomComplet: 'Kouadio Jojo',
//         dateInscrit: '2025-04-02',
//         dateDefiniEmploiTemps: null,
//         jour: null,
//         creneauVM: null,
//         creneauIndisponible: 'Pas encore defini',
//         dateNonDefini: 'N/A',
//         disponibilite: true,
//         disponibiliteCreneau: true,
//       },
//       {
//         id: null,
//         avatar: 'dc68fa0e-2e3a-4ba3-a163-013a8985667a.jpg',
//         nomComplet: 'KONAN Yan Jordane',
//         dateInscrit: '2025-04-22',
//         dateDefiniEmploiTemps: null,
//         jour: null,
//         creneauVM: null,
//         creneauIndisponible: 'Pas encore defini',
//         dateNonDefini: 'N/A',
//         disponibilite: true,
//         disponibiliteCreneau: true,
//       },
//     ],
//   },
//   {
//     nombreLivreur: 0,
//     nomRestaurant: 'LYSIE SNACK',
//     livreurs: [],
//   },
//   {
//     nombreLivreur: 0,
//     nomRestaurant: 'KFC RIVIERA 3',
//     livreurs: [],
//   },
//   {
//     nombreLivreur: 1,
//     nomRestaurant: 'KFC PMC',
//     livreurs: [
//       {
//         id: null,
//         avatar: 'b2146a25-4013-431c-a7bb-80dd69ac4345.jpg',
//         nomComplet: 'Kouamé  Daniel',
//         dateInscrit: '2025-04-01',
//         dateDefiniEmploiTemps: null,
//         jour: null,
//         creneauVM: null,
//         creneauIndisponible: 'Pas encore defini',
//         dateNonDefini: 'N/A',
//         disponibilite: true,
//         disponibiliteCreneau: true,
//       },
//     ],
//   },
//   {
//     nombreLivreur: 0,
//     nomRestaurant: 'LUNION-LAB FOOD',
//     livreurs: [],
//   },
//   {
//     nombreLivreur: 0,
//     nomRestaurant: "O'Pizza",
//     livreurs: [],
//   },
//   {
//     nombreLivreur: 0,
//     nomRestaurant: 'Turbo Food',
//     livreurs: [],
//   },
// ];

export default function useContentCtx({ initialData }: props) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState<string | null>(null);
  const textParam = searchParams.get('text');
  const [initialTurboysCreneau, setInitialTurboysCreneau] = useState<Restaurant[]>([]);
  const [turboysCreneau, setTurboysCreneau] = useState<Restaurant[]>([]);
  //  const [initialTurboysNotCreneau,setInitialTurboysNotCreneau] = useState<Restaurant[]>([])
  //  const [turboysNotCreneau,setTurboysNotCreneau] = useState<Restaurant[]>([])

  //   function filterTurboysCreneau() {
  //     let filteredData = [];

  //     if (initialData && Array.isArray(initialData.content)) {
  //         filteredData = initialData.content.filter(item => {
  //             // Vérifie si 'livreurs' existe et est un tableau avant de filtrer
  //             if (Array.isArray(item.livreurs)) {
  //                 // Utilisation de `some` pour vérifier s'il existe au moins un livreur avec `disponibiliteCreneau`
  //                 return item.livreurs.some(livreur => livreur.disponibiliteCreneau);
  //             }
  //             return false;
  //         });
  //     }

  //     // Met à jour l'état avec les résultats filtrés
  //     setInitialTurboysCreneau(filteredData);

  //                console.log({inii:initialTurboysCreneau});

  // }

  function filterTurboysCreneau() {
    let data;
    if (initialData?.content)
      data = initialData.content.filter((item) => {
        let d;
        d = item.livreurs.filter((item) => item.disponibiliteCreneau);
        if (d.length) {
          return true;
        } else {
          return false;
        }
      });
    setInitialTurboysCreneau(data || []);
  }

  console.log({ iiiiiiiii: initialTurboysCreneau });

  function filterTurboysNotCreneau() {
    let data;
    if (initialData)
      data = initialData.content.filter((item) => {
        let data;
        data = item.livreurs.filter((item) => !item.disponibiliteCreneau);
        if (data.length) {
          return true;
        } else {
          return false;
        }
      });

    // setInitialTurboysNotCreneau(data||[])
    console.log({ daiii: data });
  }

  useEffect(() => {
    filterTurboysCreneau();
    // filterTurboysNotCreneau()
  }, []);

  useEffect(() => {
    // Initialiser search à partir de textParam
    setSearch(textParam);

    // Si search n'est pas vide, filtrer les données
    if (search !== null && search.trim() !== '') {
      const filtered = initialTurboysCreneau.filter((item) => item.nomRestaurant.toLowerCase().includes(search.toLowerCase())) || [];
      setTurboysCreneau(filtered);
    } else {
      // Si search est vide, restaurer la liste initiale
      setTurboysCreneau(initialTurboysCreneau || []);
    }
  }, [search, textParam, initialTurboysCreneau]);

  return {
    turboysCreneau,
  };
}
