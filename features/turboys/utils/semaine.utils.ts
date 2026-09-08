/**
 * Le calendrier des semaines de programme, dans la convention du backend.
 *
 * <p>Lundi premier jour, quatre jours minimum, et un nom CANONIQUE par semaine physique :
 * celui de l'année qui contient son jeudi. C'est la numérotation ISO, de 1 à 53, sans
 * semaine 0. La semaine 1 est celle qui contient le 4 janvier. Le backend écrit ce nom
 * partout depuis le 08/09/2026 et accepte encore les anciens à la lecture.</p>
 *
 * <p>Avant, l'année était celle de la date : la semaine qui chevauche le Nouvel An portait
 * deux noms (le lundi 29 décembre 2025 était 2025/53 vu du 30 décembre et 2026/1 vu du
 * 2 janvier), et l'écran supposait cinquante-deux semaines partout. Tout passe par des
 * DATES : le lundi de la semaine, plus ou moins sept jours, puis le nom canonique de la
 * semaine qui contient ce lundi. Un ancien nom reçu en entrée (2025/53, 2027/0) désigne
 * quand même le bon lundi.</p>
 */

export interface SemaineAnnee {
  annee: number;
  semaine: number;
}

const JOUR_MS = 86_400_000;

/** Lundi (UTC) de la semaine 1 : celle qui contient le 4 janvier. */
function lundiSemaine1(annee: number): Date {
  const jan4 = new Date(Date.UTC(annee, 0, 4));
  const decalage = (jan4.getUTCDay() + 6) % 7; // lundi = 0
  return new Date(jan4.getTime() - decalage * JOUR_MS);
}

/** Lundi (UTC) d'une semaine, semaines 0 et 53 comprises. */
export function lundiDeSemaine(annee: number, semaine: number): Date {
  return new Date(lundiSemaine1(annee).getTime() + (semaine - 1) * 7 * JOUR_MS);
}

/** Le nom canonique de la semaine qui contient une date (lue en UTC) : l'année de son jeudi. */
export function semaineDeDate(date: Date): SemaineAnnee {
  const jour = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const decalage = (jour.getUTCDay() + 6) % 7; // lundi = 0
  const jeudi = new Date(jour.getTime() + (3 - decalage) * JOUR_MS);
  const annee = jeudi.getUTCFullYear();
  const semaine = 1 + Math.floor((jeudi.getTime() - lundiSemaine1(annee).getTime()) / (7 * JOUR_MS));
  return { annee, semaine };
}

/** Aujourd'hui, dans le calendrier local de l'opérateur. */
export function semaineCourante(maintenant: Date = new Date()): SemaineAnnee {
  return semaineDeDate(new Date(Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())));
}

export function semaineDecalee(annee: number, semaine: number, delta: number): SemaineAnnee {
  const lundi = lundiDeSemaine(annee, semaine);
  return semaineDeDate(new Date(lundi.getTime() + delta * 7 * JOUR_MS));
}

export const semainePrecedente = (annee: number, semaine: number) => semaineDecalee(annee, semaine, -1);
export const semaineSuivante = (annee: number, semaine: number) => semaineDecalee(annee, semaine, 1);
