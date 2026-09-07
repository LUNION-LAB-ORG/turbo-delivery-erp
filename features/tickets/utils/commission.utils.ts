import { Ticket } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';

/**
 * La commission due au partenaire sur une commande.
 *
 * <h3>Une seule formule, partagée</h3>
 * <p>Cette règle existait en DEUX exemplaires : ici, et dans
 * `src/actions/bon-commande.action.ts` sous le nom `calculateFinalCommission`. Les deux
 * étaient écrites à la main, et c'est celle du serveur qui décide de ce qui est
 * enregistré. Deux copies d'un calcul d'argent, c'est une divergence en attente.</p>
 *
 * <p>Le taux vient du partenaire : `POURCENTAGE` l'applique au montant de la commande,
 * tout autre type est un montant fixe, indépendant de la commande.</p>
 */
export function calculerCommission(
  restaurant: { commission: number; typeCommission: string } | undefined,
  montantCommande: number,
): number {
  if (!restaurant || !montantCommande) return 0;

  const taux = Number(restaurant.commission ?? 0);

  if (restaurant.typeCommission === 'POURCENTAGE') {
    return Number((montantCommande * (taux / 100)).toFixed(2));
  }

  // Montant fixe (FIXE) : la commission est le montant fixe du partenaire,
  // indépendant du montant de la commande.
  return Number(taux.toFixed(2));
}

export function calculateCommission(
  restaurant: Restaurant,
  montantCommande: number,
): null | number {
  if (!montantCommande) return null;
  return calculerCommission(restaurant, montantCommande);
}

/**
 * Applique une modification à une ligne en cours de saisie.
 *
 * <h3>Ce qui change</h3>
 * <p>La commission calculée était écrite dans `coutLivraison`. Or ce champ porte le COÛT
 * DE LIVRAISON partout ailleurs dans l'ERP : la colonne « Montant de livraison » des
 * archives le lit tel quel, et l'export XLS en tire la part du livreur par
 * `coutLivraison × 0,6`. Écrire la commission dedans changeait donc le sens du champ en
 * cours de route.</p>
 *
 * <p>Surtout, l'écran affichait ensuite cette valeur sous le libellé « Commission »,
 * tandis que le serveur recalculait la sienne au moment de l'envoi. Les deux ne
 * pouvaient s'accorder que par chance : c'est ainsi qu'une ligne annonçait 2 000 F à la
 * saisie et s'enregistrait à 200 F.</p>
 *
 * <p>La commission n'est plus stockée sur la ligne du tout : elle se CALCULE à
 * l'affichage, avec la formule qui sert aussi à l'envoi. Une seule source, aucun écart
 * possible.</p>
 */
export function applyTicketPatch(
  ticket: Ticket,
  patch: Partial<Ticket>,
  restaurants: Restaurant[],
): Ticket {
  const updated: Ticket = { ...ticket, ...patch };

  const targetRestaurantId = patch.restaurantId ?? updated.restaurantId;
  const rest = restaurants.find((r) => r.id === targetRestaurantId);

  if (patch.restaurantId !== undefined && rest) {
    updated.typeCommission = rest.typeCommission;
  }

  return updated;
}

export function getRestaurantInfo(
  restaurantId: string,
  restaurants: Restaurant[],
): undefined | { commission: number; typeCommission: string } {
  const rest = restaurants.find((r) => r.id === restaurantId);
  if (!rest) return undefined;
  return { commission: Number(rest.commission ?? 0), typeCommission: rest.typeCommission };
}

/**
 * La commission d'une ligne en cours de saisie, telle qu'elle sera enregistrée.
 *
 * <p>Rend la chaîne vide tant qu'il manque de quoi calculer : un champ vide dit « on ne
 * sait pas encore », là où un « 0 » affirmerait une commission nulle.</p>
 */
export function commissionAffichee(ticket: Ticket, restaurants: Restaurant[]): string {
  const montant = Number(ticket.montantCommande || 0);
  if (!montant) return '';
  const info = getRestaurantInfo(ticket.restaurantId, restaurants);
  if (!info) return '';
  return String(calculerCommission(info, montant));
}
