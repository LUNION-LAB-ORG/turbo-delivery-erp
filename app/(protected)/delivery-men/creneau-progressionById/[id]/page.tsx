
export interface Turboys  {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  telephone: string;
  domicile: string;
  email: string;
  typeDocument: string;
  numeroDocument: string;
  type: string;
  nomVehicule: string;
  immatriculationVehicule: string;
}
import { CreneauID } from "@/types/creneau-byId";
import Content from "./content";
import { LivreurDetail } from "@/types/livreur";
import { getInfoLivreurById} from "@/src/livreurInfo/livreur-info.action";
import { getCreneauById } from "@/src/creneau-livreur/creneau-livreur.action";
interface TurboysPageProps {
  params: { id: string }; // Définit explicitement le type
}


// const userDetail: LivreurDetail = {
//   id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
//   nom: "Doe",
//   prenoms: "John",
//   telephone: "+2250123456789",
//   avatarUrl: "https://example.com/avatar.jpg",
//   email: "johndoe@example.com",
//   birthDay: "1990-05-15",
//   gender: "HOMME",
//   numeroCni: "CNI123456789",
//   habitation: "Abidjan, Côte d'Ivoire",
//   immatriculation: "IVR12345",
//   matricule: "JD12345",
//   deleted: false,
//   type: "WAITING", // Peut être "WAITING", "ACTIVE", etc.
//   cniUrlR: "https://example.com/cni_r.jpg",
//   cniUrlV: "https://example.com/cni_v.jpg",
//   status: 1 // Par exemple, 1 pour un utilisateur actif
// };
  

  const dataCreneau: CreneauID[] = [
    { "id": "1", "debut": "2024-01-08", "fin": "2024-01-12", "semainePassee": true },
    { "id": "2", "debut": "2024-02-05", "fin": "2024-02-09", "semainePassee": true },
    { "id": "3", "debut": "2024-03-04", "fin": "2024-03-08", "semainePassee": true },
    { "id": "4", "debut": "2024-04-01", "fin": "2024-04-05", "semainePassee": true },
    { "id": "5", "debut": "2024-05-06", "fin": "2024-05-10", "semainePassee": true },
    { "id": "6", "debut": "2024-06-03", "fin": "2024-06-07", "semainePassee": true },
    { "id": "7", "debut": "2024-07-01", "fin": "2024-07-05", "semainePassee": true },
    { "id": "8", "debut": "2024-08-05", "fin": "2024-08-09", "semainePassee": true },
    { "id": "9", "debut": "2024-09-02", "fin": "2024-09-06", "semainePassee": true },
    { "id": "10", "debut": "2024-10-07", "fin": "2024-10-11", "semainePassee": true },
    { "id": "11", "debut": "2024-11-04", "fin": "2024-11-08", "semainePassee": true },
    { "id": "12", "debut": "2024-12-02", "fin": "2024-12-06", "semainePassee": true }
  ]
    

// export default async function UserPage({ params }: TurboysPageProps) {
//   // const { id } = await params; // Récupère l'ID depuis l'URL
//   const { id } = params;

//   // const user = userData.find(item => item.id === id);
//   const user= await getInfoLivreurById(id)

//   const dataCreneau = await getCreneauById(id)

//   console.log({dataCreneau:dataCreneau});
  

//   if (!user) {
//     return <div>Aucun utilisateur trouvé</div>;
//   }  

  
//   return <Content user={user} dataCreneau={dataCreneau}/>;
// }

export default async function UserPage({ params }: TurboysPageProps) {
  const { id } = params;  // <-- enlevé l'await qui est incorrect

  let user = null;
  let dataCreneau: CreneauID[] | null = null;

  try {
    user = await getInfoLivreurById(id);
  } catch (error) {
    console.log("Erreur getInfoLivreurById:", error);
  }

  try {
    dataCreneau = await getCreneauById(id);
  } catch (error) {
    console.log("Erreur getCreneauById:", error);
  }

  if (!user) {
    return <div>Aucun utilisateur trouvé</div>;
  }

  return <Content user={user} dataCreneau={dataCreneau ?? []} />;
}

