import { LivreurDetail } from "@/types/livreur";
import Content from "./content";
import { getInfoLivreurById } from "@/src/livreurInfo/livreur-info.action";


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


export default async function Page({ params }: TurboysPageProps) {
  const { id } = await params; // Récupère l'ID depuis l'URL
//   const user = userData.find(item => item.id === id);
const user = await getInfoLivreurById(id)

  if (!user) {
    return <div>Aucun utilisateur trouvé</div>;
  }  

  return <Content user={user} />;
}
