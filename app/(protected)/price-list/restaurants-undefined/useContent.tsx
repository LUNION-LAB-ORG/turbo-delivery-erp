'use client';

import { RestaurantDefini } from '@/types/price-list';

/**
 * ⚠ Ce contrôleur ne portait qu'un `renderCell` — l'avatar, le nom et le lien d'action
 * d'une ligne. C'est le rendu de l'écran, pas de la logique : il vit maintenant dans
 * `ListeRestaurantsIndefinis`, partagé avec la variante paginée.
 *
 * <p>Il ne reste rien à faire ici : la liste arrive déjà prête du serveur. Le hook est
 * conservé le temps que la page qui l'appelle soit revue, et se contente de rendre ce
 * qu'on lui donne.</p>
 */
export default function useContent({ initialData }: { initialData: RestaurantDefini[] }) {
  return { undefinedRestaurant: initialData ?? [] };
}
