import { auth } from "@/auth";
import Content from "./content";
import { getAllBonLivraisonEnAttentes } from "@/src/actions/bon-commande.action";
import { getAllRestaurants } from "@/src/actions/restaurants.actions";


export default async function Page() {
    const initialData = await getAllBonLivraisonEnAttentes(0, 10, { dates: { start: null, end: null } }, "");
    console.log(initialData);

    const restaurants = await getAllRestaurants();
    return (
        <Content initialData={initialData} restaurants={restaurants} />
    )
}