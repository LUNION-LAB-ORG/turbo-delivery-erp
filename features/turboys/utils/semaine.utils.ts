/**
 * Le calendrier des semaines de programme, dans la convention du backend.
 *
 * <p>`EmploiTempsTable.semaine` est un `WeekFields.of(Locale.FRANCE).weekOfYear()` : lundi
 * premier jour, quatre jours minimum, et ANNÉE CALENDAIRE. La semaine 1 est celle qui
 * contient le 4 janvier ; les premiers jours de janvier tombés avant elle font une
 * semaine 0, et une année qui finit en début de semaine a une semaine 53. En milieu
 * d'année c'est identique à l'ISO ; autour du Nouvel An, non.</p>
 *
 * <p>L'écran supposait cinquante-deux semaines partout : changer de semaine depuis la 1
 * envoyait sur la 52 de l'année d'avant, qui peut ne pas être la dernière, et « copier la
 * semaine précédente » regardait au mauvais endroit une fois par an. Tout passe par des
 * DATES : le lundi de la semaine, plus ou moins sept jours, puis le numéro de la semaine
 * qui contient ce lundi.</p>
 *
 * <p>Piège assumé : en année calendaire, la semaine qui chevauche le Nouvel An porte DEUX
 * noms. Le lundi 29 décembre 2025 est à la fois 2025/53 et 2026/1 ; le lundi 28 décembre
 * 2026 est 2026/53 et 2027/0. Ici une semaine est nommée par l'année de son lundi. Le
 * backend, lui, la nomme d'après la date du jour où il calcule : un programme créé le
 * 2 janvier peut donc porter l'autre nom. C'est un défaut de la convention, pas de ce
 * fichier, et il ne se répare que côté serveur.</p>
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

/** La semaine (convention FRANCE) qui contient une date, lue en UTC. */
export function semaineDeDate(date: Date): SemaineAnnee {
  const annee = date.getUTCFullYear();
  const jour = new Date(Date.UTC(annee, date.getUTCMonth(), date.getUTCDate()));
  const lundi1 = lundiSemaine1(annee);
  const semaine = 1 + Math.floor((jour.getTime() - lundi1.getTime()) / (7 * JOUR_MS));
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
