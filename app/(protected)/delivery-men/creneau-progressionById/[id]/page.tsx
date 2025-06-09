
export interface Turboys {
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
import Content from "./content";
import { getInfoLivreurById } from "@/src/livreurInfo/livreur-info.action";
import { getCreneauById } from "@/src/creneau-livreur/creneau-livreur.action";

interface TurboysPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: TurboysPageProps) {
  const { id } = await params; // Récupère l'ID depuis l'URL
  const user = await getInfoLivreurById(id)

  const dataCreneau = await getCreneauById(id)

  if (!user) {
    return <div>Aucun utilisateur trouvé</div>;
  }


  return <Content user={user} dataCreneau={dataCreneau} />;
}
