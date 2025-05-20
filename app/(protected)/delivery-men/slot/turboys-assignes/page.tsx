import Content from "./content";
import { Metadata } from "next";
import { getAllCreneauTurbo } from "@/src/creneau-livreur/creneau-livreur.action";

  
  export const metadata: Metadata = {
    title: "Liste des Turboys Bird ",
    description: "Liste Turboys Bird.",
  };


export default async function Page(){


      const response = await getAllCreneauTurbo();
      
        return <Content initialData={response}  />
    
}