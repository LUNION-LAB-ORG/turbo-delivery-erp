
import { redirect } from "next/navigation";
import Content from "./content";
import { getPaginationCourseExterneAutreStatus } from "@/src/actions/courses.actions";
import { getLivreursDisponible } from "@/src/actions/delivery-men.actions";
import Loading from "@/app/loading";


export default async function Page() {
    const data = await getPaginationCourseExterneAutreStatus(0, 5);
    const delivers = await getLivreursDisponible() ?? [];
    return (
        <Content initialData={data} delivers={delivers} />
    )
}