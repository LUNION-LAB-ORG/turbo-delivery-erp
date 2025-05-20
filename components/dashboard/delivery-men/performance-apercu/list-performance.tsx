import { usePathname } from 'next/navigation'; // Pour obtenir l'URL actuelle

import { PerformanceCreneauId } from "@/types/performance-creneauId"
import TableCreneau from "./table-creneau"
import FakeTableCreneau from "./fake-table-creneau"
import { Button } from "@heroui/react"
import Link from "next/link"
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { LivreurDetail } from '@/types/livreur';


interface Props {
  data: PerformanceCreneauId;
  infoUser:LivreurDetail

  // PerformanceCreneauId
    
}


export default function ListPerformanceApercu({data, infoUser}:Props){
    const pathname = usePathname(); 
   
    const creneaux= data?.creneaux?.length ? data.creneaux[0] : null

    const emploiId =data.creneaux[0]?.creneau?.emploiId?? null;


    // const lastIndex = data?.creneaux?.length ? data.creneaux.length - 1 : -1;
    // const emploiId = lastIndex >= 0 ? data.creneaux[lastIndex]?.creneau?.emploiId : null;
//    const creneaux= lastIndex >= 0 ? data.creneaux[lastIndex]: null;
    const newUrl = `${pathname}/planning-hebdomadaire/${emploiId}`;
    
    
    const fnData = () => {
        const mois = creneaux?.creneau.fin?.substring(5, 7);
        const jourDebut = creneaux?.creneau.debut?.substring(8, 10);
        const jourFin = creneaux?.creneau.fin?.substring(8, 10);

        let moi;

        const fnMois = () => {
          switch (mois) {
            case '01':
              return (moi = 'Janv');
              break;
            case '02':
              return (moi = 'Fev');
              break;
            case '03':
              return (moi = 'Mars');
              break;
            case '04':
              return (moi = 'Avril');
              break;
            case '05':
              return (moi = 'Mais');
              break;
            case '06':
              return (moi = 'Juin');
              break;
            case '07':
              return (moi = 'Jull');
              break;
            case '08':
              return (moi = 'Aout');
              break;
            case '09':
              return (moi = 'Sept');
              break;
            case '10':
              return (moi = 'Oct');
              break;
            case '11':
              return (moi = 'Nov');
              break;
            case '12':
              return (moi = 'Des');
              break;
            default:
          }
        };

        fnMois();

        return `Créneau du : ${jourDebut}-${jourFin} ${moi}`;
      };
 
    if(creneaux) { 
    return (
        <div className="flex flex-col gap-2">
            <div>
                <div className='max-w-[250px] bg-red-500 text-red-500 rounded-xl text-white py-2 px-4 mb-2'>
                 {fnData()}
                </div>

            </div>
       <TableCreneau initialData={creneaux}/>
        <div className="flex justify-end">
        <Button >
            {
                creneaux?  <Link href={newUrl}>
                Planing hebdomadaire
                </Link>:'Planing hebdomadaire non definie'
            }
    
        </Button>

        </div>
       <div className="grid gap-2 lg:grid-cols-2">
       <FakeTableCreneau/>
       <FakeTableCreneau/>
       </div>
        </div>
    )
}else{
    return<EmptyDataTable/>
}
    

}