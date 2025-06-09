import Content from "./content"
import { getAllCreneauPerformanceBird } from "@/src/creneau-livreur/creneau-livreur.action";

export default async function Page(){

    const initialData = await getAllCreneauPerformanceBird()

    return <Content initialData={initialData} />

}