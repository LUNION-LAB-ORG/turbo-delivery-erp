import { Ticket } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';

/*
 * LA COMMISSION NE SE CALCULE PAS ICI. Elle ne peut pas.
 *
 * <p>Deux formules vivaient cote ERP : une pour l'affichage, une pour l'envoi. Je les
 * avais unifiees en une seule, en ecrivant « une seule source, aucun ecart possible ».
 * C'etait faux, et l'ecran a continue d'annoncer 2 000 F pour une ligne enregistree a
 * 200 F. Les deux copies etaient d'accord entre elles ; aucune des deux n'etait
 * l'autorite.</p>
 *
 * <p>L'autorite est le backend, dans `GestionTicketService.hydrateCommande`. Il IGNORE
 * la commission que l'ERP lui envoie et la resout lui-meme :</p>
 * <ul>
 *   <li>depuis la VERSION de commission active a la DATE de la course, pas depuis le
 *       taux courant du partenaire — c'est de l'historisation, le taux d'hier n'est pas
 *       celui d'aujourd'hui ;</li>
 *   <li>en fonction de la ZONE (`zoneId`) et de sa grille tarifaire, pas seulement du
 *       partenaire — c'est pourquoi deux commandes de meme montant chez le meme
 *       partenaire n'ont pas la meme commission ;</li>
 *   <li>en la separant en deux compartiments, part variable et part fixe, dont la somme
 *       fait la commission totale ;</li>
 *   <li>avec un cas particulier pour un restaurant nomme.</li>
 * </ul>
 *
 * <p>Rien de tout cela n'est dans `restaurants[].commission`, le seul taux dont l'ecran
 * dispose. Toute valeur calculee ici serait une DEVINETTE, et l'enregistrement la
 * dementirait. L'ecran ne devine plus : il montre ce que le serveur a rendu, et rien
 * tant qu'il n'a rien rendu.</p>
 *
 * <p>Pour afficher la commission AVANT l'enregistrement il faudrait la demander au
 * backend, qui n'expose pas de route pour cela aujourd'hui.</p>
 */

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
 * La commission d'une ligne, telle que le SERVEUR l'a arrêtée.
 *
 * <p>Vide tant qu'il n'a rien rendu : un champ vide dit « pas encore connue », là où un
 * nombre affirmerait une commission que l'écran n'a aucun moyen de connaître.</p>
 */
export function commissionAffichee(ticket: Ticket): string {
  const commission = ticket.commission;
  if (commission === null || commission === undefined || commission === '') return '';
  return String(commission);
}
