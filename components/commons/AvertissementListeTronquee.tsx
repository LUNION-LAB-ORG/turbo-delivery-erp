import { AlertTriangle } from 'lucide-react';

/**
 * Le garde-fou d'une liste SANS pagination.
 *
 * <p>Un écran qui affiche 5 lignes quand le serveur en compte 9, sans rien dire, ne montre
 * pas une liste partielle : il montre une liste FAUSSE. Le lecteur n'a aucun moyen de
 * savoir que quatre livreurs manquent, et il prend ses décisions sur ce qu'il voit.</p>
 *
 * <p>C'est exactement ce que faisait la page « Performance des birds » le 11/09/2026 :
 * 5 lignes rendues pour 9 birds, et 10 pour 13 turboys côté assignés. Sept livreurs
 * invisibles au total, sans un mot à l'écran.</p>
 *
 * <p>Ce composant ne répare pas la pagination, il rend son absence VISIBLE. Tant qu'aucun
 * contrôle de page n'existe, la taille demandée doit couvrir la population ; le jour où
 * elle ne la couvre plus, cet avertissement le dit au lieu de laisser l'écran tronquer en
 * silence.</p>
 *
 * <p>Il ne rend RIEN quand la liste est complète : un bandeau permanent qui répète
 * « tout va bien » finit par ne plus être lu, et c'est précisément le jour où il change de
 * texte que personne ne le voit.</p>
 */
export function AvertissementListeTronquee({
  rendus,
  total,
}: {
  /** Nombre de lignes réellement affichées. */
  rendus: number;
  /** Nombre total annoncé par le serveur. `undefined` quand la réponse ne le porte pas. */
  total?: number;
}) {
  if (total == null || !Number.isFinite(total) || total <= rendus) {
    return null;
  }

  const manquants = total - rendus;

  return (
    <p
      className="mb-3 flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-soft-foreground"
      role="status"
    >
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        Liste incomplète : {rendus} ligne{rendus > 1 ? 's' : ''} affichée
        {rendus > 1 ? 's' : ''} sur {total}.{' '}
        {manquants} livreur{manquants > 1 ? 's' : ''} n&apos;apparaî
        {manquants > 1 ? 'ssent' : 't'} pas ici.
      </span>
    </p>
  );
}
