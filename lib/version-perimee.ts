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
 * <p>Rien n'est refusé, rien n'est invalide : c'est la page qui est en retard. Les écrans
 * l'affichaient pourtant comme un échec métier — « 0 ticket enregistré, 12 en échec »,
 * « 25 ticket(s) non validé(s) » — ce qui envoie l'opérateur chercher un champ manquant
 * ou un droit qu'il n'a pas.</p>
 *
 * <p>Ce module ne vit plus sous `features/tickets` : le cas frappe TOUT écran qui appelle
 * une action serveur. Il est branché une fois pour toutes sur le `QueryClient`, dans
 * `components/layouts/provider-component.tsx`, et couvre donc les 88 fichiers qui posent
 * un `onError` sans qu'aucun d'eux n'ait à le savoir.</p>
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

/**
 * Une seule notification, meme si vingt-cinq appels echouent.
 *
 * <p>Un lot de vingt-cinq validations produit vingt-cinq echecs, donc vingt-cinq passages
 * ici. On n'agit qu'UNE fois par vie de page.</p>
 *
 * <p>Les notifications brutes des ecrans ne sont PAS effacees. Deux tentatives ont echoue
 * et sont documentees pour qu'on ne les refasse pas : `toast.dismiss()` sans argument
 * n'efface rien sur sonner 2.0.7 — verifie a l'ecran, l'attribut `data-removed` reste a
 * `false`, alors que la croix d'une notification, elle, la retire bien ; et reafficher son
 * propre message sous un identifiant fixe apres un effacement ne le reaffiche pas, sonner
 * considere l'identifiant comme congedie.</p>
 *
 * <p>Ce n'est pas grave : sur le chemin normal la page recharge en moins de deux secondes
 * et tout part avec elle. Sur l'autre chemin, les notifications des ecrans s'effacent
 * d'elles-memes au bout de quatre secondes tandis que la notre reste, et le bouton
 * « Tout fermer » de l'application couvre le reste.</p>
 */
let dejaSignale = false;

/** À appeler à la place d'une notification d'erreur quand la version est périmée. */
export function signalerVersionPerimee(): void {
  if (dejaSignale) return;
  dejaSignale = true;

  // Recharger detruirait la saisie si rien ne la garde : on propose, on n'impose pas.
  if (!stockageDisponible() || dejaRecharge()) {
    toast.error(MESSAGE_VERSION_PERIMEE, {
      action: { label: 'Recharger', onClick: () => window.location.reload() },
      description: 'Rien n\u2019a été refusé : cette page est en retard sur le serveur.',
      duration: Infinity,
    });
    return;
  }

  noterLeRechargement();
  toast.error(MESSAGE_VERSION_PERIMEE, {
    description: 'Rechargement en cours. Vos lignes en saisie sont conservées.',
    duration: Infinity,
  });
  window.setTimeout(() => window.location.reload(), 1800);
}
