import { PaginatedResponse } from "@/types";
import { BirdPerformance } from "@/types/slot";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface props{
  initialData: PaginatedResponse<RestaurantProgressionTurbo> | null
}


// const  restaurantsData: RestaurantProgressionTurbo[] = [
//   {
//     nombreLivreur: 2,
//     nomRestaurant: "Le Délice Gourmand",
//     livreurs: [
//       {
//         id: "1a2b3c4d-1234-5678-9101-abcdef123456",
//         nomComplet: "Jean Dupont",
//         progression: 80,
//         jour: {
//           jourTravaille: 5,
//           jourNonTravaille: 2
//         },
//         creneauVM: {
//           debut: "2025-04-01",
//           fin: "2025-04-01"
//         }
//       },
//       {
//         id: "2b3c4d5e-2345-6789-1011-bcdef2345678",
//         nomComplet: "Alice Martin",
//         progression: 50,
//         jour: {
//           jourTravaille: 4,
//           jourNonTravaille: 3
//         },
//         creneauVM: {
//           debut: "2025-04-02",
//           fin: "2025-04-02"
//         }
//       }
//     ]
//   },
//   {
//     nombreLivreur: 1,
//     nomRestaurant: "Saveurs du Monde",
//     livreurs: [
//       {
//         id: "3c4d5e6f-3456-7890-1121-cdef34567890",
//         nomComplet: "Mohamed Ali",
//         progression: 95,
//         jour: {
//           jourTravaille: 6,
//           jourNonTravaille: 1
//         },
//         creneauVM: {
//           debut: "2025-04-03",
//           fin: "2025-04-03"
//         }
//       }
//     ]
//   },
//   {
//     nombreLivreur: 3,
//     nomRestaurant: "La Table du Chef",
//     livreurs: [
//       {
//         id: "4d5e6f7g-4567-8901-1232-def456789012",
//         nomComplet: "Sophie Bernard",
//         progression: 60,
//         jour: {
//           jourTravaille: 5,
//           jourNonTravaille: 2
//         },
//         creneauVM: {
//           debut: "2025-04-04",
//           fin: "2025-04-04"
//         }
//       },
//       {
//         id: "5e6f7g8h-5678-9012-2343-ef5678901234",
//         nomComplet: "Lucas Morel",
//         progression: 40,
//         jour: {
//           jourTravaille: 3,
//           jourNonTravaille: 4
//         },
//         creneauVM: {
//           debut: "2025-04-05",
//           fin: "2025-04-05"
//         }
//       },
//       {
//         id: "6f7g8h9i-6789-0123-3454-f67890123456",
//         nomComplet: "Emma Lefevre",
//         progression: 70,
//         jour: {
//           jourTravaille: 5,
//           jourNonTravaille: 2
//         },
//         creneauVM: {
//           debut: "2025-04-06",
//           fin: "2025-04-06"
//         }
//       }
//     ]
//   }
// ];

export default function useContentCtx({initialData}:props){

    const searchParams = useSearchParams(); 
     const [search,setSearch] = useState<string|null>(null)
     const textParam = searchParams.get('text');
      const [initialTurboysAssignes, setInitialTurboysAssignes] = useState<RestaurantProgressionTurbo[]>([]);
       const [turboysAssignes, setTurboysAssignes] = useState<RestaurantProgressionTurbo[]>([]);

        // const [data, setData] = useState<RestaurantProgressionTurbo[]|[]>(initialData?.content||[]);

        function filterTurboysAssignes(){
          let data
          if(initialData)
         data=initialData.content.filter(item=>item.nombreLivreur>0)
      setInitialTurboysAssignes(data||[])
           }

           useEffect(()=>{
            filterTurboysAssignes()
  
          },[])

         useEffect(() => { 
           // Initialiser search à partir de textParam
           setSearch(textParam);
         
           // Si search n'est pas vide, filtrer les données
           if (search !== null && search.trim() !== "") {
             const filtered = initialTurboysAssignes.filter(item => 
               item.nomRestaurant.toLowerCase().includes(search.toLowerCase())
             ) || [];
             setTurboysAssignes(filtered);
           } else {
             // Si search est vide, restaurer la liste initiale
             setTurboysAssignes(initialTurboysAssignes||[]);
             console.log("search vide");
           }
         
         }, [search, textParam, initialTurboysAssignes]);
        
    

    return {
      turboysAssignes
    }
}