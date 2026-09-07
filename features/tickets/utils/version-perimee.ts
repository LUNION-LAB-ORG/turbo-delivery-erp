/**
 * Reconnaître une page qui tourne sur une version périmée de l'ERP.
 *
 * <h3>Ce qui se passe</h3>
 * <p>Les actions serveur de Next portent un identifiant qui est une EMPREINTE DU BUILD.
 * L'onglet resté ouvert garde le JavaScript de la version qu'il a chargée ; dès qu'un
 * déploiement passe, l'identifiant qu'il appelle n'existe plus sur le serveur, qui
 * répond « Server Action … was not found on the server ».</p>
 *
 * <p>Rien n'est refusé, rien n'est invalide : c'est l'onglet qui est en retard. Mais
 * l'écran l'affichait comme un échec métier — « 0 ticket enregistré, 12 en échec » — ce
 * qui envoie l'opérateur chercher un champ manquant ou un droit qu'il n'a pas.</p>
 *
 * <p>Ce cas se produit à CHAQUE déploiement, sur tous les postes qui ont l'écran ouvert.
 * Il n'est donc pas rare, et il mérite son propre message.</p>
 */
export function estVersionPerimee(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('failed to find server action') ||
    (m.includes('server action') && m.includes('was not found on the server'))
  );
}

/** Ce qu'on dit à l'opérateur, à la place d'un décompte d'échecs. */
export const MESSAGE_VERSION_PERIMEE =
  'Une nouvelle version de l’ERP a été déployée. Rechargez la page pour continuer.';
