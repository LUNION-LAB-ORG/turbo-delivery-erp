import { CreneauID } from "@/types/creneau-byId";
import { useEffect, useState } from "react";


interface props{
  dataCreneau: CreneauID[] | null
}


export default function useContentCtx({dataCreneau}:props){

  const [exerianceLivreur,setExerianceLivreur] = useState<string>('')
 
  
  // Fonction pour calculer l'expérience
  const calculerExperience=(dataCreneau: CreneauID[])=>{
    if (dataCreneau.length === 0) return "Aucune expérience";
  
    // Trier les créneaux par date de début pour trouver le plus ancien
    const premierCreneau = dataCreneau.reduce((prev, curr) =>
      new Date(prev.debut) < new Date(curr.debut) ? prev : curr
    );
  
    const datePremierCreneau = new Date(premierCreneau.debut);
    const dateActuelle = new Date();
  
    // Calcul de la différence en années, mois et jours
    let anneeDiff = dateActuelle.getFullYear() - datePremierCreneau.getFullYear();
    let moisDiff = dateActuelle.getMonth() - datePremierCreneau.getMonth();
    let jourDiff = dateActuelle.getDate() - datePremierCreneau.getDate();
  
    // Ajustement si nécessaire
    if (jourDiff < 0) {
      moisDiff -= 1;
      jourDiff += new Date(dateActuelle.getFullYear(), dateActuelle.getMonth(), 0).getDate();
    }
    if (moisDiff < 0) {
      anneeDiff -= 1;
      moisDiff += 12;
    }
  
    // Construire une chaîne lisible
    const experience = [];
    if (anneeDiff > 0) experience.push(`${anneeDiff} an${anneeDiff > 1 ? "s" : ""}`);
    if (moisDiff > 0) experience.push(`${moisDiff} mois`);
    if (jourDiff > 0) experience.push(`${jourDiff} jour${jourDiff > 1 ? "s" : ""}`);
  
    return experience.length > 0 ? experience.join(", ") : "Moins d'un jour";
  }

  useEffect(()=>{

    if(dataCreneau)
      setExerianceLivreur(calculerExperience(dataCreneau) ) 
    
  },[dataCreneau])



    return {
      exerianceLivreur
    }
}