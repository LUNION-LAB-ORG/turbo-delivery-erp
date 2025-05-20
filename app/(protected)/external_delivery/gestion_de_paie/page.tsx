
import Content from "./content";
import { getFicheDePaies } from "@/src/actions/gestion-de-paie.actions";


export default async function Page() {
    const initialData = await getFicheDePaies(null, null);
    return (
        <Content initialData={initialData} />
    )
}
