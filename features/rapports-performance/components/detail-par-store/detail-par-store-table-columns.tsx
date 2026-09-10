import type { IStorePerformance } from '@/features/rapports-performance/types/performance.type';

/**
 * L'ancre du bloc, pour que le detail financier puisse y renvoyer.
 *
 * <p>Elle vit ICI, dans le fichier le plus leger du bloc : le detail financier n'a besoin
 * que de cette chaine, et l'importer depuis la section l'obligerait a charger le tableau,
 * son hook de tri et la bibliotheque de composants pour poser un lien.</p>
 */
export const ANCRE_DETAIL_PAR_STORE = 'detail-par-store';

export type ColonneStore = keyof Pick<
  IStorePerformance,
  | 'nom'
  | 'totalDeliveries'
  | 'totalOrderValue'
  | 'successRate'
  | 'deliveryFeesCollected'
  | 'turboDeliveryServiceFees'
  | 'totalFacture'
>;

export interface DefinitionColonneStore {
  id: ColonneStore;
  /** L'intitule de la colonne. L'unite y figure UNE fois, pas sur chaque cellule. */
  entete: string;
  /** Un nombre se lit a droite, en chasse tabulaire. Un nom, non. */
  numerique: boolean;
  /**
   * La colonne porte-t-elle un total en pied de tableau ?
   *
   * <p>⚠ `successRate` est la seule a repondre non, et ce n'est pas un oubli : le taux de
   * tete est celui de L'ENSEMBLE des courses, pas la moyenne des taux par store. Une
   * moyenne de moyennes donnerait le meme poids a un etablissement de 8 455 livraisons et
   * a un autre qui en compte 144. Le serveur ne l'additionne pas non plus.</p>
   */
  totalisable: boolean;
  /**
   * Largeur minimale de la colonne.
   *
   * <p>⚠ Elles sont CALIBREES sur la fenetre reelle du poste, pas choisies au juge. La page
   * a 24 px de marge, la carte 24 px de plus : il reste environ 904 px pour le tableau. La
   * feuille de la bibliotheque pose `px-4` sur chaque en-tete et chaque cellule, soit
   * 7 x 32 = 224 px de gouttieres. Le contenu doit donc tenir dans 680 px, et la somme des
   * minimums ci-dessous fait 40 rem, soit 640 px. Une colonne plus large et le tableau part
   * en defilement horizontal : « Facture totale », la colonne qu'on vient lire, sort alors
   * du cadre sans que rien ne le signale.</p>
   */
  classeLargeur: string;
}

/**
 * Les colonnes du detail par store.
 *
 * <p>Ce sont EXACTEMENT les indicateurs des cartes de tete et du detail financier, dans
 * l'ordre ou la page les presente : d'abord ce qui se compte, puis ce qui se vend, puis ce
 * qui se facture. Le lecteur descend la page et retrouve les memes grandeurs, dans le meme
 * ordre, ligne par ligne.</p>
 *
 * <p>Le fichier est separe pour une raison mecanique : un tableau v3 leve
 * « Cell count must match column count » et emporte la PAGE ENTIERE en 500 des qu'une
 * ligne n'a pas autant de cellules que d'en-tetes. Une seule liste, lue par l'en-tete
 * comme par la ligne de total, rend l'ecart impossible.</p>
 */
export const COLONNES_DETAIL_PAR_STORE: DefinitionColonneStore[] = [
  {
    id: 'nom',
    entete: 'Établissement',
    numerique: false,
    totalisable: false,
    classeLargeur: 'min-w-[9rem]',
  },
  {
    id: 'totalDeliveries',
    entete: 'Livraisons',
    numerique: true,
    totalisable: true,
    classeLargeur: 'min-w-[4.5rem]',
  },
  {
    id: 'totalOrderValue',
    entete: 'Valeur des commandes (FCFA)',
    numerique: true,
    totalisable: true,
    classeLargeur: 'min-w-[6rem]',
  },
  {
    id: 'successRate',
    entete: 'Taux de succès',
    numerique: true,
    totalisable: false,
    classeLargeur: 'min-w-[4rem]',
  },
  {
    id: 'deliveryFeesCollected',
    entete: 'Frais de livraison (FCFA)',
    numerique: true,
    totalisable: true,
    classeLargeur: 'min-w-[5.5rem]',
  },
  {
    id: 'turboDeliveryServiceFees',
    entete: 'Frais de service TURBO (FCFA)',
    numerique: true,
    totalisable: true,
    classeLargeur: 'min-w-[5.5rem]',
  },
  {
    id: 'totalFacture',
    entete: 'Facture totale (FCFA)',
    numerique: true,
    totalisable: true,
    classeLargeur: 'min-w-[5.5rem]',
  },
];

/*
 * Les montants sont ecrits SANS leur suffixe, l'unite etant portee par l'en-tete.
 *
 * Cinq colonnes de montants sur vingt lignes feraient cent « FCFA » a l'ecran, pour une
 * information deja donnee par le titre de la colonne, et une largeur qui pousserait le
 * tableau au defilement horizontal sur la fenetre reelle du poste.
 *
 * Le groupement passe par `Intl` en `fr-FR`, comme `formatMontant` : c'est la MEME espace
 * fine insecable que sur les cartes de tete. Un groupement different d'un bloc a l'autre
 * suffit a faire douter que deux nombres soient le meme.
 */
const NOMBRE_FR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/**
 * Un nombre entier groupe. `null` rend le tiret d'absence, jamais « 0 ».
 *
 * <p>⚠ L'ARRONDI EST NECESSAIRE, ce n'est pas de la mise en forme. Les montants arrivent en
 * flottants (`1.09465875E8`), et additionner cinq lignes de facture donne
 * `109465874.99999999` la ou le total de tete vaut `109465875` : releve sur la production,
 * sur cinq etablissements. Sans arrondi a l'affichage, la ligne de total du tableau
 * afficherait un centime de moins que la carte juste au-dessus, et le lecteur, dont c'est
 * precisement le geste sur cet ecran, conclurait a une erreur de calcul.</p>
 */
export function formatEntier(valeur: number | null | undefined): string {
  if (valeur == null || !Number.isFinite(valeur)) return '—';
  return NOMBRE_FR.format(Math.round(valeur));
}

/** Un taux. `null` = aucune course conclue sur ce store : le taux n'existe pas. */
export function formatTaux(valeur: number | null | undefined): string {
  if (valeur == null || !Number.isFinite(valeur)) return '—';
  return `${valeur.toFixed(1)} %`;
}
