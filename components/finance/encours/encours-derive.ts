import type { IEncoursFacture, IEncoursPartenaire, IEncoursReleve } from '@/features/encours';

/**
 * Chiffres que le releve porte deja ligne a ligne mais qu'aucun total n'exprimait.
 *
 * <p>Ils sont calcules ici, une seule fois, pour que le bandeau, le tableau et les cartes
 * tactiles ne racontent pas trois histoires differentes du meme releve.</p>
 */

/** Une periode annoncee mais pas encore facturee : ni montant, ni acompte, ni solde. */
export const STATUT_A_VENIR = 'À venir';

/** L'echeance est passee et la facture n'est pas soldee. C'est le seul geste de l'ecran. */
export const STATUT_EN_RETARD = 'En retard';

export function estAVenir(facture: IEncoursFacture): boolean {
  return facture.statut === STATUT_A_VENIR;
}

/** Toutes les factures d'un partenaire, tous points de vente confondus. */
export function facturesDuPartenaire(partenaire: IEncoursPartenaire): IEncoursFacture[] {
  return (partenaire.stores ?? []).flatMap((s) => s.factures ?? []);
}

export interface IRetard {
  /** Somme des soldes en retard. */
  montant: number;
  nbFactures: number;
  nbPartenaires: number;
}

/**
 * Ce qui appelle un geste, et rien d'autre.
 *
 * <p>Le releve n'exposait que des totaux qui INFORMENT : facture, reste, taux. Un
 * operateur qui relance un partenaire ne cherche pas le reste global, il cherche ce qui
 * est en retard. Le chiffre existait deja, eparpille dans une colonne de puces.</p>
 */
export function calculerRetard(releve: IEncoursReleve): IRetard {
  const partenaires = new Set<string>();
  let montant = 0;
  let nbFactures = 0;

  (releve.partenaires ?? []).forEach((p) => {
    facturesDuPartenaire(p).forEach((f) => {
      if (f.statut !== STATUT_EN_RETARD) return;
      montant += f.solde ?? 0;
      nbFactures += 1;
      partenaires.add(p.groupe);
    });
  });

  return { montant, nbFactures, nbPartenaires: partenaires.size };
}

/** Somme des acomptes deja encaisses sur un jeu de factures. */
export function sommeAcomptes(factures: IEncoursFacture[]): number {
  return factures.reduce((total, f) => total + (f.acompte ?? 0), 0);
}
