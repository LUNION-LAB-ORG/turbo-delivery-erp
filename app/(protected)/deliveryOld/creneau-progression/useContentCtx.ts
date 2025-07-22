import { PaginatedResponse } from "@/types";
import { BirdPerformance } from "@/types/slot";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";


interface props{
  initialData: PaginatedResponse<CreneauProgressionBird> | null
}

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

export default function useContentCtx({initialData}:props){

    const searchParams = useSearchParams(); 
     const [search,setSearch] = useState<string|null>(null)
     const textParam = searchParams.get('text');

        const [data, setData] = useState<CreneauProgressionBird[]|[]>(initialData?.content||[]);

         useEffect(() => { 
           // Initialiser search à partir de textParam
           setSearch(textParam);
         
           // Si search n'est pas vide, filtrer les données
           if (search !== null && search.trim() !== "") {
             const filtered = initialData?.content.filter(item => 
               item.nomComplet.toLowerCase().includes(search.toLowerCase())
             ) || [];
             setData(filtered);
           } else {
             // Si search est vide, restaurer la liste initiale
             setData(initialData?.content||[]);
           }
         
         }, [search, textParam, initialData]);
        
    

    return {
        data
    }
}