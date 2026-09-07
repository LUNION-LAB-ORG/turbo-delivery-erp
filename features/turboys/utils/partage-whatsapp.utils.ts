import type { IProgramme } from '../types/programme.types';
import { libelleJourInactif } from './jour.utils';

/**
 * Partager un programme sur WhatsApp.
 *
 * <p>Informer le livreur est le but de l'écran, et aucun canal automatique ne l'atteint
 * aujourd'hui : pas de notification poussée configurée, jeton SMS révoqué, application
 * non publiée. Le programme part donc à la main, et c'est WhatsApp que les Opérations
 * utilisent. Ce lien ouvre la conversation avec le livreur, le message déjà écrit ; il ne
 * reste qu'à l'envoyer. Rien ne part sans ce dernier geste.</p>
 *
 * <p>Le message ne porte PAS le carburant : montrer un montant au livreur crée une créance
 * perçue, et cette décision n'est pas prise.</p>
 */

const JOURS: Array<{ cle: string; libelle: string }> = [
  { cle: 'LUNDI', libelle: 'Lundi' },
  { cle: 'MARDI', libelle: 'Mardi' },
  { cle: 'MERCREDI', libelle: 'Mercredi' },
  { cle: 'JEUDI', libelle: 'Jeudi' },
  { cle: 'VENDREDI', libelle: 'Vendredi' },
  { cle: 'SAMEDI', libelle: 'Samedi' },
  { cle: 'DIMANCHE', libelle: 'Dimanche' },
];

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

/**
 * Le numéro au format que WhatsApp attend : indicatif puis numéro, sans signe.
 *
 * <p>Les numéros ivoiriens ont dix chiffres depuis 2021 ; on préfixe 225. Un numéro déjà
 * international est gardé tel quel. Un numéro à huit chiffres est d'avant la
 * renumérotation, et son préfixe dépend de l'opérateur : on ne devine pas, on rend null
 * et le bouton se ferme.</p>
 */
export function numeroWhatsApp(telephone?: string | null): string | null {
  const chiffres = (telephone ?? '').replace(/\D/g, '');
  if (chiffres.length === 10) return `225${chiffres}`;
  if (chiffres.length > 10) return chiffres;
  return null;
}

/** Le texte du message, jour par jour, sans montant. */
export function texteProgramme(programme: IProgramme, annee: number, semaine: number): string {
  const prenom = (programme.livreurNom ?? '').split(' ')[0] || 'Bonjour';
  const lignes = JOURS.map((jr) => {
    const j = programme.jours?.find((x) => (x.jour ?? '').toUpperCase() === jr.cle);
    if (!j || !j.actif) return `${jr.libelle} : ${libelleJourInactif(j)}`;
    return `${jr.libelle} : ${hhmm(j.debut)} - ${hhmm(j.fin)}`;
  });
  return [
    `Bonjour ${prenom}, voici ton programme de la semaine ${semaine} (${annee}) :`,
    '',
    ...lignes,
    '',
    "Merci de le confirmer dans l'application.",
  ].join('\n');
}

/** Le lien complet, ou null si le numéro ne permet pas d'ouvrir une conversation. */
export function lienWhatsApp(telephone: string | null | undefined, texte: string): string | null {
  const numero = numeroWhatsApp(telephone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texte)}`;
}
