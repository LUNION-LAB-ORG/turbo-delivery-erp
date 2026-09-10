// Module M2 — Programmes hebdomadaires planifiés par les Opérations.
// Consomme /api/erp/programmes (backend déployé). Le programme EST un emploi
// du temps + un workflow de statut.

export type StatutProgramme = 'BROUILLON' | 'PLANIFIE' | 'NOTIFIE' | 'ACCEPTE' | 'REFUSE';

// Type de collaborateur (axe « contrat ») renvoyé par le backend pour le
// filtre TYPE et le sous-libellé de la grille. Aligné sur LivreurType.
export type TypeLivreurProgramme = 'JOURNALIER' | 'SUPERVISEUR_LIVREUR' | 'INDEPENDANT';

// Maquette M2 — un poste/partenaire (restaurant) desservi sur un jour. Le nom
// est dénormalisé (le backend le stocke tel quel dans le JSON du jour).
export interface IPosteJour {
  restaurantId: string;
  restaurantNom: string;
}

export interface IJourProgramme {
  jour: string; // LUNDI, MARDI, ... DIMANCHE
  date?: string | null;
  debut?: string | null; // "HH:mm" ou "HH:mm:ss"
  fin?: string | null;
  actif: boolean;
  postes?: IPosteJour[] | null;
  /**
   * Frais de carburant du jour (FCFA), saisis par les Ops. Sans objet un jour de repos.
   *
   * <p>C'est une intention de planning. Le total qui fait foi est
   * `IProgramme.montantCarburantHebdo`, figé par le serveur à la publication.</p>
   */
  montantCarburant?: number | null;
  /**
   * Ce que la clôture nocturne a CONSTATÉ : PRESENT, RETARD, ABSENT, JUSTIFIE, NON_INSCRIT.
   *
   * <p>Posé par le serveur, jamais par l'éditeur. La clôture repasse aussi `actif` à false
   * quand elle conclut à une absence : sans ce champ, l'écran affichait une absence comme
   * un repos.</p>
   */
  statutJour?: string | null;
  absenceJustifiee?: boolean | null;
  absenceMotif?: string | null;
}

/** Ce qu'a donné le dernier envoi du programme par WhatsApp. */
export type StatutEnvoiWhatsApp = 'ENVOYE' | 'ECHEC' | 'NON_CONFIGURE' | 'SANS_NUMERO';

export interface IProgramme {
  id: string;
  livreurId: string | null;
  livreurNom: string | null;
  typeLivreur?: TypeLivreurProgramme | string | null;
  annee: number;
  semaine: number;
  jours: IJourProgramme[];
  statut: StatutProgramme | null;
  source: string | null;
  publieLe: string | null;
  accepteLe: string | null;
  refuseLe: string | null;
  motifRefus: string | null;
  nbRelances: number;
  /**
   * Total carburant de la semaine, FIGÉ par le serveur quand le programme part chez le
   * livreur. Null tant que rien n'est engagé, ou qu'aucun montant n'a été saisi.
   */
  montantCarburantHebdo?: number | null;
  /**
   * Le site (partenaire) effectif de la semaine : celui choisi pour le programme, sinon
   * celui de la fiche du livreur. Les exports regroupent par ce site.
   */
  siteId?: string | null;
  /** Vrai quand le site a été choisi pour cette semaine, faux quand il vient de la fiche. */
  siteDeLaSemaine?: boolean;
  /** Dernier envoi WhatsApp ; absent tant que rien n'a été tenté. */
  whatsappStatut?: StatutEnvoiWhatsApp | string | null;
  whatsappLe?: string | null;
  /** L'identifiant du message parti, ou la raison de l'échec. */
  whatsappDetail?: string | null;
}

export interface ICreerProgrammePayload {
  livreurId: string;
  annee: number;
  semaine: number;
  jours: IJourProgramme[];
  /** Le site de la semaine ; absent = celui de la fiche du livreur. */
  sitePartnerId?: string | null;
}

export interface IModifierProgrammePayload {
  id: string;
  jours: IJourProgramme[];
  /** Vrai quand la commande décide du site ; absent, le site de la semaine ne bouge pas. */
  siteModifie?: boolean;
  /** Avec `siteModifie` : le site de la semaine, null pour revenir à celui de la fiche. */
  sitePartnerId?: string | null;
}

/** Dupliquer tous les programmes d'une semaine vers une semaine vide. */
export interface IDupliquerSemainePayload {
  annee: number;
  semaine: number;
  depuisAnnee: number;
  depuisSemaine: number;
}

export interface IDuplicationSemaine {
  annee: number;
  semaine: number;
  depuisAnnee: number;
  depuisSemaine: number;
  crees: number;
  ignores: number;
  /** Livreurs qui avaient déjà déclaré cette semaine dans l'application ; leur déclaration est intacte. */
  dejaDeclares: number;
}

// ── Carburant : engagement de la semaine dans le circuit finance ──────────────

export type StatutChargeVariable =
  | 'EN_ATTENTE_DGA'
  | 'VALIDE_DGA'
  | 'REJETE_DGA'
  | 'APPROUVE_DG'
  | 'REJETE_DG'
  | 'DECAISSE';

/** La charge variable qui porte le carburant d'une semaine (extrait du VM finance). */
export interface IEngagementCarburant {
  id: string;
  designation: string;
  montant: number;
  statut: StatutChargeVariable | string;
  creerPar?: string | null;
  dateDepense?: string | null;
  createdAt?: string | null;
  justificatif?: string | null;
}

/** Ce que la semaine a publié, et ce qui en est engagé. */
export interface IEtatCarburantSemaine {
  annee: number;
  semaine: number;
  /** Somme des totaux figés des programmes publiés ; null si aucun n'en porte. */
  totalPublie: number | null;
  nbProgrammesPublies: number;
  nbProgrammesSansMontant: number;
  engagement: IEngagementCarburant | null;
  /** totalPublie moins le montant engagé ; null sans engagement. */
  ecart: number | null;
}

export interface IEngagerCarburantPayload {
  annee: number;
  semaine: number;
  categorieId: string;
  /** Le PDF des programmes publiés, joint en justificatif. */
  justificatif: Blob;
}

// RG-32 — autosuffisance : livreurs actifs par jour, indépendants vs planifiés.
export interface IAutosuffisanceJour {
  jour: string; // LUNDI..DIMANCHE
  independants: number;
  planifies: number;
  total: number;
}
