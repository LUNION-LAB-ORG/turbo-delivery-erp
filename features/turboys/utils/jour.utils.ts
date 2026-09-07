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
