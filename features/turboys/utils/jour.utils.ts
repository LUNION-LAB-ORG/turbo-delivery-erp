import type { IJourProgramme } from '../types/programme.types';

/**
 * Ce qu'un jour INACTIF veut dire.
 *
 * <p>Il n'est pas toujours un repos. La clôture nocturne repasse `actif` à false quand elle
 * conclut à une absence, et pose `statutJour` en même temps. La grille, les exports et
 * l'aperçu écrivaient « Repos » dans les deux cas : une absence se lisait comme un jour
 * chômé prévu, et le total carburant qui l'excluait paraissait faux.</p>
 */
export function libelleJourInactif(j?: IJourProgramme | null): 'Absence justifiée' | 'Absent' | 'Repos' {
  if (j?.statutJour === 'ABSENT') return 'Absent';
  if (j?.statutJour === 'JUSTIFIE') return 'Absence justifiée';
  return 'Repos';
}

/**
 * Ce qu'il faut écrire quand une semaine ne prévoit aucun repos.
 *
 * <p>La direction l'a posé en recette : un livreur programmé sept jours sur sept n'a pas
 * pris son jour de repos, et ce repos se règle. La mention doit se lire sans recoupement,
 * sur la grille comme sur les exports.</p>
 */
export const OBSERVATION_SEPT_SUR_SEPT = 'Jour de repos non prévu : à compenser';

/** Vrai quand les sept jours de la semaine sont travaillés. */
export function estSeptSurSept(jours?: IJourProgramme[] | null): boolean {
  const actifs = new Set((jours ?? []).filter((j) => j?.actif && j.jour).map((j) => j.jour.toUpperCase()));
  return actifs.size >= 7;
}
