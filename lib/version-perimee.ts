import { toast } from 'sonner';

/**
 * Reconnaître une page qui tourne sur une version périmée de l'ERP.
 *
 * <h3>Ce qui se passe</h3>
 * <p>Les actions serveur de Next portent un identifiant qui est une EMPREINTE DU BUILD.
 * Un onglet garde le JavaScript de la version qu'il a chargée ; dès qu'un déploiement
 * passe, l'identifiant qu'il appelle n'existe plus sur le serveur, qui répond 404 et
 * « Server Action … was not found on the server ».</p>
 *
 * <p>Rien n'est refusé, rien n'est invalide : c'est la page qui est en retard. L'écran
 * l'affichait pourtant comme un échec métier — « 0 ticket enregistré, 12 en échec » —
 * ce qui envoie l'opérateur chercher un champ manquant ou un droit qu'il n'a pas.</p>
 *
 * <h3>Pourquoi l'écran recharge lui-même</h3>
 * <p>Le seul remède est de recharger, et un opérateur qui saisit des tickets ne va pas
 * lire une notification à chaque ligne refusée : il en avait douze. L'écran le fait donc
 * seul, UNE fois, en le disant. C'est devenu acceptable parce que les lignes en cours de
 * saisie sont désormais gardées dans le navigateur et reprises au retour.</p>
 *
 * <p>Et seulement si elles le sont : quand le stockage est indisponible — navigation
 * privée, réglage du poste — recharger détruirait la saisie. Dans ce cas l'écran
 * n'agit pas de lui-même, il propose, et laisse la main.</p>
 */

const CLE_RECHARGEMENT = 'turbo-erp:rechargement-version';

export function estVersionPerimee(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('failed to find server action') ||
    m.includes('unrecognizedactionerror') ||
    (m.includes('server action') && m.includes('was not found on the server'))
  );
}

export const MESSAGE_VERSION_PERIMEE =
  'Une nouvelle version de l’ERP a été déployée. La page doit être rechargée.';

/** Le navigateur garde-t-il vraiment ce qu'on lui confie ? */
function stockageDisponible(): boolean {
  try {
    const sonde = 'turbo-erp:sonde';
    window.localStorage.setItem(sonde, '1');
    const relu = window.localStorage.getItem(sonde) === '1';
    window.localStorage.removeItem(sonde);
    return relu;
  } catch {
    return false;
  }
}

function dejaRecharge(): boolean {
  try {
    return window.sessionStorage.getItem(CLE_RECHARGEMENT) === '1';
  } catch {
    // Sans mémoire d'une tentative, on ne peut pas garantir l'absence de boucle :
    // on ne recharge pas tout seul.
    return true;
  }
}

function noterLeRechargement(): void {
  try {
    window.sessionStorage.setItem(CLE_RECHARGEMENT, '1');
  } catch {
    /* sans effet */
  }
}

/** À appeler à la place d'une notification d'erreur quand la version est périmée. */
export function signalerVersionPerimee(): void {
  const proposer = () =>
    toast.error(MESSAGE_VERSION_PERIMEE, {
      action: { label: 'Recharger', onClick: () => window.location.reload() },
      description: 'Rien n’a été refusé : cette page est en retard sur le serveur.',
      duration: Infinity,
    });

  // Recharger detruirait la saisie si rien ne la garde : on propose, on n'impose pas.
  if (!stockageDisponible() || dejaRecharge()) {
    proposer();
    return;
  }

  noterLeRechargement();
  toast.error(MESSAGE_VERSION_PERIMEE, {
    description: 'Rechargement en cours. Vos lignes en saisie sont conservées.',
    duration: 4000,
  });
  window.setTimeout(() => window.location.reload(), 1800);
}
