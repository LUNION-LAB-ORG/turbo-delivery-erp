import type { IProgramme } from '../types/programme.types';

/**
 * Ce que le dernier envoi WhatsApp d'un programme a donné, en une phrase.
 *
 * <p>En recette, « message non reçu » était la seule information disponible : elle ne
 * disait ni si l'envoi avait été tenté, ni ce qui l'avait empêché. Le serveur écrit
 * maintenant le résultat sur le programme, et l'écran le lit tel quel.</p>
 */
export interface LibelleWhatsApp {
  texte: string;
  /** `attention` appelle un geste (renvoyer, corriger le numéro, configurer) ; `ok` non ; `muet` est informatif. */
  ton: 'ok' | 'attention' | 'muet';
}

const dateCourte = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: '2-digit' });
};

/** Raccourcit une raison technique pour une ligne de grille ; le détail complet reste dans l'aperçu. */
const court = (detail?: string | null) => {
  const t = (detail ?? '').trim();
  if (!t) return '';
  if (t.includes('20003')) return 'identifiants Twilio refusés';
  return t.length > 70 ? `${t.slice(0, 69)}…` : t;
};

export function libelleWhatsApp(p: Pick<IProgramme, 'whatsappStatut' | 'whatsappLe' | 'whatsappDetail'>): LibelleWhatsApp | null {
  switch (p.whatsappStatut) {
    case 'ENVOYE':
      return { texte: `WhatsApp envoyé le ${dateCourte(p.whatsappLe)}`.trim(), ton: 'ok' };
    case 'ECHEC':
      return { texte: `WhatsApp non parti : ${court(p.whatsappDetail) || 'échec'}`, ton: 'attention' };
    case 'NON_CONFIGURE':
      return { texte: 'WhatsApp non configuré', ton: 'muet' };
    case 'SANS_NUMERO':
      return { texte: 'WhatsApp : pas de numéro à dix chiffres', ton: 'attention' };
    default:
      return null;
  }
}

/** La phrase du message de confirmation après une publication ou un envoi. */
export function phraseWhatsAppApresEnvoi(p: Pick<IProgramme, 'whatsappStatut' | 'whatsappDetail'>): { texte: string; ok: boolean } {
  switch (p.whatsappStatut) {
    case 'ENVOYE':
      return { ok: true, texte: 'Le livreur est notifié dans l’application et par WhatsApp.' };
    case 'ECHEC':
      return { ok: false, texte: `Le livreur est notifié dans l’application, mais le WhatsApp n’est pas parti : ${court(p.whatsappDetail) || 'échec'}.` };
    case 'SANS_NUMERO':
      return { ok: false, texte: 'Le livreur est notifié dans l’application ; sans numéro à dix chiffres, pas de WhatsApp.' };
    case 'NON_CONFIGURE':
      return { ok: true, texte: 'Le livreur est notifié dans l’application. WhatsApp n’est pas configuré.' };
    default:
      return { ok: true, texte: 'Le livreur est notifié dans l’application.' };
  }
}
