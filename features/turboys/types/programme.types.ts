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
}

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
}

export interface ICreerProgrammePayload {
  livreurId: string;
  annee: number;
  semaine: number;
  jours: IJourProgramme[];
}

export interface IModifierProgrammePayload {
  id: string;
  jours: IJourProgramme[];
}

// RG-32 — autosuffisance : livreurs actifs par jour, indépendants vs planifiés.
export interface IAutosuffisanceJour {
  jour: string; // LUNDI..DIMANCHE
  independants: number;
  planifies: number;
  total: number;
}
