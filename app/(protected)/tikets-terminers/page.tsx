
import Content from "./content";
import { getAllRestaurants } from "@/src/restaurants/restaurants.actions";
import { getBonLivraisonAll } from "@/src/actions/bon-commande.action";


export default async function Page() {
    const data = await getBonLivraisonAll(0, 10);
    const restaurants = await getAllRestaurants();
    return (
        <Content initialData={data} restaurants={restaurants} />
    )
}