/**
 * Le vocabulaire de l'orientation des fonds.
 *
 * <p>La ligne est declaree STRUCTURELLEMENT, et non par un import de `IFactureRF` :
 * l'ecran ne lit que sept champs sur les vingt de la facture, et le banc
 * `app/apercu/recouvrement` doit pouvoir monter le tableau sur des lignes d'exemple
 * sans fabriquer une facture complete.</p>
 */
export interface LigneOrientation {
  dateVisa?: null | string;
  id: string;
  montant: number;
  numero: string;
  numeroVisa?: null | string;
  partenaire: string;
  viseur?: null | string;
}

/** Valeur du choix « les deux files » : elle ne nomme aucun statut du serveur. */
export const FILE_TOUTES = 'TOUTES';

/**
 * Les files que l'ecran agrege.
 *
 * <p>Elles vivent ici, avec le reste du vocabulaire, pour que le banc
 * `app/apercu/recouvrement` monte le VRAI champ File et non une copie de ses trois
 * libelles : une copie ne verifie rien.</p>
 */
export const FILES_ORIENTATION = [
  { label: 'Les deux files', value: FILE_TOUTES },
  { label: 'En attente visa DGA', value: 'En attente visa DGA' },
  { label: 'Visé DGA (stock)', value: 'Visé DGA' },
] as const;

/** Une date absente rend le glyphe d'absence, jamais la date du jour. */
export function formatDateFr(iso?: null | string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

/**
 * Ce que pese une selection.
 *
 * <p>Un geste en lot engage de l'argent : le total se calcule sur les lignes REELLEMENT
 * ciblees, jamais sur une moyenne ni sur le total de la file.</p>
 */
export function sommeMontants(lignes: readonly LigneOrientation[]): number {
  return lignes.reduce((total, ligne) => total + ligne.montant, 0);
}

/** Longueur minimale du motif, imposee par le backend sur toute sortie ou retenue de caisse. */
export const MOTIF_MIN = 30;
