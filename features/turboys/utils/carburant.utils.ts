import type { IJourProgramme, IProgramme } from '../types/programme.types';

/**
 * Le carburant d'un programme, une seule arithmétique pour l'éditeur, la grille et les
 * exports.
 *
 * <p>Deux montants coexistent et ne disent pas la même chose. Le PRÉVISIONNEL se calcule à
 * l'écran depuis les jours : la somme des montants des jours travaillés. L'ENGAGÉ est la
 * colonne que le serveur fige à la publication. Tant qu'un programme n'est pas parti chez
 * le livreur, seul le prévisionnel existe ; après, c'est l'engagé qui fait foi, même si la
 * clôture nocturne a depuis repassé un jour à inactif pour absence.</p>
 */

/** Somme des montants des jours travaillés ; null si aucun jour travaillé n'en porte. */
export function carburantPrevisionnel(jours: IJourProgramme[] | null | undefined): number | null {
  let total: number | null = null;
  for (const j of jours ?? []) {
    if (!j?.actif) continue;
    const m = j.montantCarburant;
    if (m === null || m === undefined || !Number.isFinite(m)) continue;
    total = (total ?? 0) + m;
  }
  return total;
}

/** Nombre de jours travaillés du programme. */
export function joursTravailles(jours: IJourProgramme[] | null | undefined): number {
  return (jours ?? []).filter((j) => j?.actif).length;
}

/**
 * Le montant à afficher pour un programme, et s'il est figé.
 *
 * <p>Figé : la colonne du serveur existe. Sinon le prévisionnel, calculé ici.</p>
 */
export function carburantAffiche(p: IProgramme): { fige: boolean; montant: number | null } {
  const fige = p.montantCarburantHebdo;
  if (fige !== null && fige !== undefined && Number.isFinite(fige)) {
    return { fige: true, montant: fige };
  }
  return { fige: false, montant: carburantPrevisionnel(p.jours) };
}

export interface TotauxCarburant {
  /** Grand total, engagé et prévisionnel confondus. */
  total: number;
  /** Part déjà figée par le serveur. */
  engage: number;
  /** Part encore prévisionnelle. */
  previsionnel: number;
  /** Sous-total par type de livreur (clé = typeLivreur, ou 'AUTRE'). */
  parType: Record<string, number>;
  /** Programmes dont aucun jour travaillé ne porte de montant. */
  sansMontant: number;
}

/** Les totaux d'une semaine, tels que le document papier les présente. */
export function totauxCarburant(programmes: IProgramme[]): TotauxCarburant {
  const t: TotauxCarburant = { engage: 0, parType: {}, previsionnel: 0, sansMontant: 0, total: 0 };
  for (const p of programmes) {
    const { fige, montant } = carburantAffiche(p);
    if (montant === null) {
      t.sansMontant += 1;
      continue;
    }
    t.total += montant;
    if (fige) t.engage += montant;
    else t.previsionnel += montant;
    const cle = p.typeLivreur ?? 'AUTRE';
    t.parType[cle] = (t.parType[cle] ?? 0) + montant;
  }
  return t;
}
