import Content from "./content"
import { Metadata } from "next";
import { getAllPerformanceBird } from "@/src/performance/performance.action";

    
  export const metadata: Metadata = {
    title: "Liste des  performance des Turboys Bird ", 
    description: "Liste des performance des Turboys Bird.",
  };


export default async function Page(){
        const response = await getAllPerformanceBird();
                
  
    return <Content initialData={response} />

}