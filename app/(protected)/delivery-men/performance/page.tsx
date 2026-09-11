import Content from "./content"
import { Metadata } from "next";
import { getAllPerformanceBird } from "@/src/performance/performance.action";
import { TAILLE_LISTE_PERFORMANCE } from "@/src/performance/performance.constants";

export const metadata: Metadata = {
    title: "PERFORMANCES BIRDS",
    description: "LISTE DES PERFORMANCES BIRDS",
};

export default async function Page() {
    const response = await getAllPerformanceBird(0, TAILLE_LISTE_PERFORMANCE);
    return <Content initialData={response} />
}