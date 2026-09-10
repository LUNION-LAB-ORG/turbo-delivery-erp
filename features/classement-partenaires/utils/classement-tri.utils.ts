import type { SensTri, TriClassement } from '@/features/classement-partenaires/types/classement.types';

/**
 * Le tri du classement : ce que le serveur applique par defaut, et comment il se lit.
 *
 * <p>Le tri n'est PAS une operation d'ecran. Changer d'indicateur change le RANG de chaque
 * partenaire, et le rang est calcule par le serveur avec ses ex aequo. Trier les lignes
 * dans le navigateur donnerait un ordre juste avec des rangs faux, ce qui est pire qu'un
 * ecran qui ne trie pas. Un clic sur un en-tete change donc l'URL, qui relance la
 * requete.</p>
 */

export const TRI_DEFAUT: TriClassement = 'LIVRAISONS';
export const SENS_TRI_DEFAUT: SensTri = 'DESC';

/** Le sens naturel d'un indicateur : un nom se lit de A a Z, un montant du plus gros. */
export function sensNaturel(tri: TriClassement): SensTri {
  return tri === 'NOM' ? 'ASC' : 'DESC';
}

/** Ce que « 1er » veut dire selon l'indicateur, ecrit sous le tableau. */
export const LIBELLE_TRI: Record<TriClassement, string> = {
  LIVRAISONS: 'nombre de livraisons',
  MONTANT_LIVRAISON: 'montant de livraison',
  COMMISSION: 'commission',
  TOTAL: 'total à régler',
  VALEUR_COMMANDES: 'valeur des commandes',
  TAUX_SUCCES: 'taux de succès',
  NOM: 'nom du partenaire',
};

/** La colonne du tableau qui porte l'indicateur. Sert a marquer l'en-tete actif. */
export const COLONNE_DE_TRI: Record<TriClassement, string> = {
  LIVRAISONS: 'nbLivraisons',
  MONTANT_LIVRAISON: 'montantLivraison',
  COMMISSION: 'commission',
  TOTAL: 'totalARegler',
  VALEUR_COMMANDES: 'valeurCommandes',
  TAUX_SUCCES: 'tauxSucces',
  NOM: 'nom',
};

/** L'indicateur porte par une colonne, ou `null` quand la colonne ne se trie pas. */
export function triDeColonne(colonne: string): TriClassement | null {
  const trouve = (Object.keys(COLONNE_DE_TRI) as TriClassement[]).find(
    (t) => COLONNE_DE_TRI[t] === colonne,
  );
  return trouve ?? null;
}
