
import { getPerformanceCreneauById } from '@/src/performance/performance.action';
import Content from './content'
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { getInfoLivreurById } from '@/src/livreurInfo/livreur-info.action';


// interface Props {
//   data:PerformanceCreneauId;    
// }

const dataCreneau={
    livreurId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    creneaux: [
      {
        creneau: {
          debut: "2025-04-07",
          fin: "2025-04-07",
          emploiId:"0b729dc1-03e4-40d8-8567-2e0c5fa027f3",
        },
        progressions: [
          {
            jour: "LUNDI",
            progression: 5,
            heure: 8,
            commission: 4
          },
          {
            jour: "MARDI",
            progression: 6,
            heure: 9,
            commission: 40
          },
          {
            jour: "MERCREDI",
            progression: 8,
            heure: 10,
            commission: 100
          },
          {
            jour: "JEUDI",
            progression: 3,
            heure: 5,
            commission: 50
          }
        ]
      },
      {
        creneau: {
          debut: "2025-04-07",
          fin: "2025-04-07",
          emploiId:"0b729dc1-03e4-40d8-8567-2e0c5fa027f3",

        },
        progressions: [
          {
            jour: "LUNDI",
            progression: 5,
            heure: 8,
            commission: 4
          },
          {
            jour: "MARDI",
            progression: 6,
            heure: 7,
            commission: 40
          },
          {
            jour: "MERCREDI",
            progression: 7,
            heure: 5,
            commission: 100
          },
          {
            jour: "JEUDI",
            progression: 3,
            heure: 0,
            commission: 50
          }
        ]
      },
      {
        creneau: {
          debut: "2025-04-07",
          fin: "2025-04-07",
          emploiId:"0b729dc1-03e4-40d8-8567-2e0c5fa027f3",

        },
        progressions: [
          {
            jour: "LUNDI",
            progression: 5,
            heure: 8,
            commission: 4
          },
          {
            jour: "MARDI",
            progression: 6,
            heure: 9,
            commission: 40
          },
          {
            jour: "MERCREDI",
            progression: 8,
            heure: 10,
            commission: 100
          },
          {
            jour: "JEUDI",
            progression: 3,
            heure: 5,
            commission: 50
          }
        ]
      },
      {
        creneau: {
          debut: "2025-04-07",
          fin: "2025-04-07",
          emploiId:"0b729dc1-03e4-40d8-8567-2e0c5fa027f3",

        },
        progressions: [
          {
            jour: "LUNDI",
            progression: 5,
            heure: 8,
            commission: 4
          },
          {
            jour: "MARDI",
            progression: 6,
            heure: 9,
            commission: 40
          },
          {
            jour: "MERCREDI",
            progression: 8,
            heure: 10,
            commission: 100
          },
          {
            jour: "JEUDI",
            progression: 3,
            heure: 5,
            commission: 50
          }
        ]
      },
      {
        creneau: {
          debut: "2025-04-07",
          fin: "2025-04-07",
          emploiId:"0b729dc1-03e4-40d8-8567-2e0c5fa027f3",

        },
        progressions: [
          {
            jour: "LUNDI",
            progression: 5,
            heure: 8,
            commission: 4
          },
          {
            jour: "MARDI",
            progression: 6,
            heure: 9,
            commission: 40
          },
          {
            jour: "MERCREDI",
            progression: 8,
            heure: 10,
            commission: 100
          },
          {
            jour: "JEUDI",
            progression: 3,
            heure: 5,
            commission: 50
          }
        ]
      },
      {
        creneau: {
          debut: "2025-04-07",
          fin: "2025-04-07",
          emploiId:"5f6b6875-e58d-4d95-bff1-a2df3f746f66",

        },
        progressions: [
          {
            jour: "LUNDI",
            progression: 5,
            heure: 8,
            commission: 4
          },
          {
            jour: "MARDI",
            progression: 6,
            heure: 9,
            commission: 40
          },
          {
            jour: "MERCREDI",
            progression: 8,
            heure: 10,
            commission: 100
          },
          {
            jour: "JEUDI",
            progression: 3,
            heure: 5,
            commission: 50
          }
        ]
      }
    ]
  }
  
interface CreneauIdPageProps {
    params: { livreurId: string }
  }

export default async function Page({ params }: CreneauIdPageProps){

      const { livreurId } = params
      // const user = userData.find(item => item.id === id);
      const infoUser = await getInfoLivreurById(livreurId)
      
      const user= await getPerformanceCreneauById(livreurId)
          
      // const dataCreneau = await getCreneauById(id)
    
      if (!user||!infoUser) {
        return <EmptyDataTable/>
      } 
 
   
    return (
             <Content data={user} infoUser={infoUser} />
    )
}