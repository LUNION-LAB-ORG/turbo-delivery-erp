
import { getPerformancePlanning } from '@/src/performance/performance.action';
import Content from './content';
import { PerformanceHebdomadaire } from '@/types/performance-hebdomadaire';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
// import Content from './content'


// interface Props {

//   data:PerformanceCreneauId;    
// }



// const performanceCreneau: PerformanceHebdomadaire = {
//   id: '5f6b6875-e58d-4d95-bff1-a2df3f746f66',
//   heureTravailParCreneau: 56,
//   heureArret: 24,
//   jourManque: 3,
//   creneauVM: {
//     debut: "2025-04-03",
//     fin: "2025-04-10",
//     emploiId: "5f6b6875-e58d-4d95-bff1-a2df3f746f66"
//   },
//   jours: [
//     {
//       jour: 'MARDI',
//       debut: '08:00:00',
//       fin: '20:00:00',
//       heures: [
//         {
//           debut: '08:00:00',
//           fin: '09:00:00',
//           statut: 'NON_DEMARRE', // Le créneau n'a pas encore démarré
//         },
//         {
//           debut: '09:00:00',
//           fin: '10:00:00',
//           statut: 'TRAVAILLE', // Le créneau est en cours de travail
//         },
//         {
//           debut: '10:00:00',
//           fin: '11:00:00',
//           statut: 'ABSENT', // L'utilisateur est absent à ce créneau
//         },
//         {
//           debut: '11:00:00',
//           fin: '12:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur travaille pendant ce créneau
//         },
//         {
//           debut: '12:00:00',
//           fin: '13:00:00',
//           statut: 'HORS_SERVICE', // L'utilisateur est en pause ou hors service
//         },
//         {
//           debut: '13:00:00',
//           fin: '14:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur reprend le travail
//         },
//         {
//           debut: '14:00:00',
//           fin: '15:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur continue de travailler
//         },
//         {
//           debut: '15:00:00',
//           fin: '16:00:00',
//           statut: 'ABSENT', // L'utilisateur est absent à ce créneau
//         },
//         {
//           debut: '16:00:00',
//           fin: '17:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur reprend son travail
//         },
//         {
//           debut: '17:00:00',
//           fin: '18:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur est encore en train de travailler
//         },
//         {
//           debut: '18:00:00',
//           fin: '19:00:00',
//           statut: 'HORS_SERVICE', // L'utilisateur est en pause
//         },
//         {
//           debut: '19:00:00',
//           fin: '20:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur termine la journée de travail
//         },
//       ],
//     },
//     {
//       jour: 'LUNDI',
//       debut: '08:00:00',
//       fin: '20:00:00',
//       heures: [
//         {
//           debut: '08:00:00',
//           fin: '09:00:00',
//           statut: 'NON_DEMARRE', // Le créneau n'a pas encore démarré
//         },
//         {
//           debut: '09:00:00',
//           fin: '10:00:00',
//           statut: 'TRAVAILLE', // Le créneau est en cours de travail
//         },
//         {
//           debut: '10:00:00',
//           fin: '11:00:00',
//           statut: 'ABSENT', // L'utilisateur est absent à ce créneau
//         },
//         {
//           debut: '11:00:00',
//           fin: '12:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur travaille pendant ce créneau
//         },
//         {
//           debut: '12:00:00',
//           fin: '13:00:00',
//           statut: 'HORS_SERVICE', // L'utilisateur est en pause ou hors service
//         },
//         {
//           debut: '13:00:00',
//           fin: '14:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur reprend le travail
//         },
//         {
//           debut: '14:00:00',
//           fin: '15:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur continue de travailler
//         },
//         {
//           debut: '15:00:00',
//           fin: '16:00:00',
//           statut: 'ABSENT', // L'utilisateur est absent à ce créneau
//         },
//         {
//           debut: '16:00:00',
//           fin: '17:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur reprend son travail
//         },
//         {
//           debut: '17:00:00',
//           fin: '18:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur est encore en train de travailler
//         },
//         {
//           debut: '18:00:00',
//           fin: '19:00:00',
//           statut: 'HORS_SERVICE', // L'utilisateur est en pause
//         },
//         {
//           debut: '19:00:00',
//           fin: '20:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur termine la journée de travail
//         },
//       ],
//     },
//     {
//       jour: 'MERCREDI',
//       debut: '08:00:00',
//       fin: '20:00:00',
//       heures: [
//         {
//           debut: '08:00:00',
//           fin: '09:00:00',
//           statut: 'NON_DEMARRE', // Le créneau n'a pas encore démarré
//         },
//         {
//           debut: '09:00:00',
//           fin: '10:00:00',
//           statut: 'TRAVAILLE', // Le créneau est en cours de travail
//         },
//         {
//           debut: '10:00:00',
//           fin: '11:00:00',
//           statut: 'ABSENT', // L'utilisateur est absent à ce créneau
//         },
//         {
//           debut: '11:00:00',
//           fin: '12:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur travaille pendant ce créneau
//         },
//         {
//           debut: '12:00:00',
//           fin: '13:00:00',
//           statut: 'HORS_SERVICE', // L'utilisateur est en pause ou hors service
//         },
//         {
//           debut: '13:00:00',
//           fin: '14:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur reprend le travail
//         },
//         {
//           debut: '14:00:00',
//           fin: '15:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur continue de travailler
//         },
//         {
//           debut: '15:00:00',
//           fin: '16:00:00',
//           statut: 'ABSENT', // L'utilisateur est absent à ce créneau
//         },
//         {
//           debut: '16:00:00',
//           fin: '17:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur reprend son travail
//         },
//         {
//           debut: '17:00:00',
//           fin: '18:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur est encore en train de travailler
//         },
//         {
//           debut: '18:00:00',
//           fin: '19:00:00',
//           statut: 'HORS_SERVICE', // L'utilisateur est en pause
//         },
//         {
//           debut: '19:00:00',
//           fin: '20:00:00',
//           statut: 'TRAVAILLE', // L'utilisateur termine la journée de travail
//         },
//       ],
//     },
//   ],
// };


interface CreneauIdPageProps {
    params: { livreurId: string,emploiId:string }; // Définit explicitement le type
  }

export default async function Page({ params }: CreneauIdPageProps){

      const { livreurId,emploiId } = params; // Récupère l'ID depuis l'URL
      // const user = userData.find(item => item.id === id);
      
      const user= await getPerformancePlanning(livreurId,emploiId)
          

      // console.log({userrr:user});
      
    
      if (!user) {
        return <EmptyDataTable/>;
      } 
 
   
    return (
             <Content data={user} />
    )
}