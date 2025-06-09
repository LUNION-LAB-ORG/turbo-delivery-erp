import Content from "./content"
import { getAllCreneauPerformanceTurbo } from "@/src/creneau-livreur/creneau-livreur.action";


export default async function Page(){
    
    const initialData = await getAllCreneauPerformanceTurbo()

    
    
    return <Content initialData={initialData} />

}