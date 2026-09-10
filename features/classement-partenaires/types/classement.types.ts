/**
 * Le contrat de `/api/erp/analytics/classement`, recopie des VM Java qui font foi
 * (`main-backend/src/main/java/com/lunionlab/turbo/vm/classement/`).
 *
 * <p>Les champs qui peuvent valoir `null` sont types `| null` et NON optionnels : un
 * `commission?: number` laisserait ecrire `commission ?? 0`, et l'ecran affirmerait zero
 * la ou le serveur dit « ce partenaire n'est soumis a aucune commission ». La difference
 * entre « rien a payer » et « rien a afficher » est precisement ce que cet ecran doit
 * rendre visible.</p>
 */

/** Les sept indicateurs de tri acceptes par le serveur. Un tri = un classement propre. */
export const TRIS_CLASSEMENT = [
  'LIVRAISONS',
  'MONTANT_LIVRAISON',
  'COMMISSION',
  'TOTAL',
  'VALEUR_COMMANDES',
  'TAUX_SUCCES',
  'NOM',
] as const;

export type TriClassement = (typeof TRIS_CLASSEMENT)[number];

export type SensTri = 'ASC' | 'DESC';

/** `HAUSSE` et `BAISSE` parlent du RANG, pas du chiffre : gagner des places est une hausse. */
export type SensTendance = 'HAUSSE' | 'BAISSE' | 'STABLE' | 'NOUVEAU';

export interface IPeriodeClassement {
  debut: string;
  fin: string;
  /** `2026-04` quand la periode est un mois calendaire complet, `null` sinon. */
  mois: string | null;
  granularite: 'MENSUEL' | 'LIBRE';
  /** `SNAPSHOT` = archive figee, `CALCUL` = mesure refaite a l'instant. Jamais nul. */
  source: 'SNAPSHOT' | 'CALCUL';
  calculeLe: string;
}

export interface ISelectionAnalytics {
  mode: 'GLOBAL' | 'UNITAIRE' | 'MULTI' | 'GROUPE';
  restaurantId: string | null;
  restaurantIds: string[];
  groupeId: string | null;
  groupeNom: string | null;
  parametresIgnores: string[];
}

export interface ITendanceRang {
  /** `null` quand le partenaire n'etait pas classe le mois precedent. */
  rangPrecedent: number | null;
  /** `rangPrecedent - rang`, donc POSITIF quand le partenaire gagne des places. */
  ecart: number | null;
  sens: SensTendance;
  /** Deja mis en forme par le serveur : `+2`, `-1`, `=`, ou `null`. */
  libelle: string | null;
}

export interface ILigneClassement {
  /** Porte les ex aequo : 1, 2, 2, 4. On l'affiche TEL QUEL, on ne renumerote pas. */
  rang: number;
  restaurantId: string;
  /** `null` quand l'identifiant ne correspond plus a aucun etablissement. */
  nom: string | null;
  nbLivraisons: number;
  montantLivraison: number;
  /** Toujours servi, meme quand `soumisCommission` est faux. Voir ce champ-la. */
  commission: number;
  /** Faux : le partenaire n'est soumis a aucune commission, la cellule reste vide. */
  soumisCommission: boolean;
  typeCommission: 'POURCENTAGE' | 'MONTANT_FIXE' | 'AUCUNE' | string;
  /** Un montant existe alors que le regime dit qu'il ne devrait pas : cela doit se voir. */
  commissionInattendue: boolean;
  totalARegler: number;
  valeurCommandes: number;
  /** `null` quand aucune course n'a ete conclue : un tiret, jamais « 0 % ». */
  tauxSucces: number | null;
  tendance: ITendanceRang | null;
}

export interface ITotauxClassement {
  nbPartenairesClasses: number;
  nbLivraisons: number;
  montantLivraison: number;
  /**
   * La somme de TOUTES les commissions, y compris celles qu'aucune ligne n'affiche.
   * Le pied de tableau peut donc depasser la somme des cellules visibles, et l'ecran le
   * dit au lieu de laisser croire a une erreur d'addition.
   */
  commission: number;
  totalARegler: number;
  valeurCommandes: number;
}

export interface ITendanceInfo {
  disponible: boolean;
  /** `AUCUN_INSTANTANE_PRECEDENT`, `NON_DEMANDEE`, `SELECTION_VIDE`, ou `null`. */
  raison: string | null;
  mois: string | null;
  periodeDebut: string | null;
  periodeFin: string | null;
  source: string;
}

export interface IClassement {
  periode: IPeriodeClassement;
  tri: TriClassement;
  sens: SensTri;
  selection: ISelectionAnalytics;
  parametresIgnores: string[];
  totaux: ITotauxClassement;
  /** DEJA TRIEE par le serveur, du 1er au dernier. Ne pas la retrier a l'ecran. */
  lignes: ILigneClassement[];
  tendance: ITendanceInfo;
  /** Un mois clos sans instantane : les chiffres sont recalcules, le rattrapage est possible. */
  instantaneAbsent: boolean;
}

export interface IEcartIndicateurs {
  /** `rangReference - rangRecent` : POSITIF quand le partenaire gagne des places. */
  rang: number | null;
  sensRang: 'HAUSSE' | 'BAISSE' | 'STABLE' | null;
  nbLivraisons: number | null;
  /** `null` quand la reference vaut zero : un demarrage n'a pas de pourcentage. */
  nbLivraisonsPct: number | null;
  montantLivraison: number | null;
  montantLivraisonPct: number | null;
  commission: number | null;
  commissionPct: number | null;
  totalARegler: number | null;
  totalAReglerPct: number | null;
  valeurCommandes: number | null;
  valeurCommandesPct: number | null;
  /** En POINTS de pourcentage, pas en pourcentage d'un pourcentage. */
  tauxSucces: number | null;
}

export interface IEvolutionMois {
  mois: string;
  periodeDebut: string;
  periodeFin: string;
  rang: number;
  /** « 5e sur 12 » et « 5e sur 69 » ne disent pas la meme chose : la taille est servie. */
  nbPartenairesClasses: number;
  nbLivraisons: number;
  montantLivraison: number;
  commission: number;
  soumisCommission: boolean;
  typeCommission: string;
  totalARegler: number;
  valeurCommandes: number;
  tauxSucces: number | null;
  calculeLe: string;
  /** L'ecart avec le mois precedent DE LA SERIE. `null` sur le premier mois. */
  ecart: IEcartIndicateurs | null;
}

export interface IEvolutionPartenaire {
  restaurantId: string;
  nom: string | null;
  tri: TriClassement;
  sens: SensTri;
  granularite: string;
  /** Du plus ancien au plus recent. Vide tant qu'aucun instantane n'a ete capture. */
  mois: IEvolutionMois[];
  /** Les mois que la frise ne peut pas montrer, au format `2026-03`. Jamais nul. */
  moisSansInstantane: string[];
}

export interface IComparaisonLigne {
  restaurantId: string;
  nom: string | null;
  /** La periode de REFERENCE, la plus ancienne. `null` si le partenaire n'y figure pas. */
  a: ILigneClassement | null;
  /** La periode COMPAREE, la plus recente. */
  b: ILigneClassement | null;
  /** `B moins A`. `null` des qu'un des deux cotes manque. */
  ecarts: IEcartIndicateurs | null;
  presence: 'LES_DEUX' | 'A_SEULEMENT' | 'B_SEULEMENT';
}

export interface IComparaisonClassement {
  periodeA: IPeriodeClassement;
  periodeB: IPeriodeClassement;
  tri: TriClassement;
  sens: SensTri;
  selection: ISelectionAnalytics;
  parametresIgnores: string[];
  totauxA: ITotauxClassement;
  totauxB: ITotauxClassement;
  ecartsTotaux: IEcartIndicateurs;
  lignes: IComparaisonLigne[];
}

export interface IRapportSnapshot {
  mois: string | null;
  periodeDebut: string | null;
  periodeFin: string | null;
  granularite: string | null;
  statut:
    | 'CAPTURE'
    | 'DEJA_CAPTURE'
    | 'REECRIT'
    | 'REFUSE_MOIS_NON_CLOS'
    | 'AUCUN_PARTENAIRE'
    | string;
  message: string | null;
  lignesEcrites: number | null;
  lignesIgnorees: number | null;
  nbPartenairesClasses: number | null;
  calculeLe: string | null;
  details: IRapportSnapshot[] | null;
}

/** Ce que l'ecran envoie au serveur. La periode est TOUJOURS une plage, voir l'API. */
export interface IParamsClassement {
  debut: Date;
  fin: Date;
  tri: TriClassement;
  sens: SensTri;
  restaurantId?: string;
  restaurantIds?: string[];
  groupeId?: string;
}
