import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types/general';

import {
  IActionsFiltre,
  IAdoptionResultat,
  IAuditAction,
  IConnexion,
  IConnexionsFiltre,
  IForcerDeconnexionResultat,
  ISessionErp,
  ISessionsFiltre,
  ISupervisionStats,
} from '../types';

// Backend : main-backend, routes /api/erp/** (permitAll côté Spring Security).
// `apiClientHttp` est utilisé SANS `service` → baseURL = NEXT_PUBLIC_API_BACKEND_URL,
// comme les modules standard / créneaux.
//
// ⚠ X-User-Id est le seul élément d'identité que connaît la garde `GardeSupervision`
// côté backend (elle redemande le rôle à l'annuaire ERP et refuse tout ce qui n'est
// pas DG / DGA / Admin / Ops Manager). Sans cet en-tête, TOUS les appels ci-dessous
// répondent 403. Le client HTTP le pose désormais centralement depuis la session
// next-auth ; on continue de le passer explicitement ici, car ces écrans exigent
// l'identité du LECTEUR et ne doivent pas dépendre d'un défaut implicite.

const entete = (userId: string) => ({ headers: { 'X-User-Id': userId } });

/** Retire les filtres vides pour ne pas envoyer `module=&typeAction=` au backend. */
function nettoyer(params: Record<string, string | number | boolean | undefined>) {
  const sortie: Record<string, string> = {};
  Object.entries(params).forEach(([cle, valeur]) => {
    if (valeur === undefined || valeur === null || valeur === '') return;
    sortie[cle] = String(valeur);
  });
  return sortie;
}

export const supervisionAPI = {
  // ── Supervision des sessions ───────────────────────────────────────────────

  /** Les quatre compteurs de tête d'écran. */
  stats(userId: string): Promise<ISupervisionStats> {
    return apiClientHttp.request<ISupervisionStats>({
      endpoint: '/api/erp/supervision/stats',
      method: 'GET',
      config: entete(userId),
    });
  },

  /** « Qui est connecté » : sessions ouvertes, écran courant, statut d'activité. */
  enLigne(
    userId: string,
    filtre: Partial<ISessionsFiltre> = {},
    options: { export?: boolean } = {},
  ): Promise<ISessionErp[]> {
    return apiClientHttp.request<ISessionErp[]>({
      endpoint: '/api/erp/supervision/en-ligne',
      method: 'GET',
      params: nettoyer({
        agence: filtre.agence,
        statut: filtre.statut,
        recherche: filtre.recherche,
        export: options.export ? 'true' : undefined,
      }),
      config: entete(userId),
    });
  },

  /**
   * Déconnexion forcée. Seule écriture de tout l'écran ; l'effet est différé d'un
   * battement de cœur (≤ 30 s) car le jeton ERP est stateless et non révocable.
   */
  forcerDeconnexion(sessionId: string, userId: string): Promise<IForcerDeconnexionResultat> {
    return apiClientHttp.request<IForcerDeconnexionResultat>({
      endpoint: `/api/erp/supervision/sessions/${sessionId}/forcer-deconnexion`,
      method: 'POST',
      config: entete(userId),
    });
  },

  /** Adoption des comptes ERP : première connexion, fréquence, jamais connectés. */
  adoption(
    userId: string,
    jamaisConnectes = false,
    options: { export?: boolean } = {},
  ): Promise<IAdoptionResultat> {
    return apiClientHttp.request<IAdoptionResultat>({
      endpoint: '/api/erp/supervision/adoption',
      method: 'GET',
      params: nettoyer({
        jamaisConnectes: String(jamaisConnectes),
        export: options.export ? 'true' : undefined,
      }),
      config: entete(userId),
    });
  },

  // ── Lecture du journal d'audit (aucune écriture n'existe côté backend) ─────

  /**
   * Journal des actions métier, paginé.
   *
   * `options.export` marque l'appel comme relecture d'export : le backend écrit alors
   * un événement d'audit EXPORT (règle de gestion 5 — « qui a exporté quoi, avec quels
   * filtres »). Seule la PREMIÈRE page d'un export le porte, pour ne pas produire une
   * trace par page relue.
   *
   * ORDRE DU JOURNAL. Aucun parametre de tri n'est envoye ici, et ce n'est pas un
   * oubli : le backend n'en accepte aucun. `AuditLectureResource.actions()` construit
   * `PageRequest.of(page, size)` sans `Sort`, et `AuditLectureService.listerActions`
   * delegue a `findAll(spec, pageable)` : le SQL part donc sans ORDER BY, et Postgres
   * rend les lignes dans l'ordre qui l'arrange, en pratique le plus ancien en tete.
   * Trier cote ERP ne trierait que les 25 lignes de la page affichee, jamais le
   * journal, et laisserait l'export faux : sur un journal pagine c'est une
   * demi-verite. Sans ORDER BY, LIMIT/OFFSET n'est meme pas stable, une meme ligne
   * peut ressortir sur deux pages pendant qu'une autre disparait. La correction est
   * cote backend : `Sort.by(DESC, "occurredAt")` dans le `PageRequest`, comme le fait
   * deja `JournalSecuriteResource` pour son propre journal.
   */
  actions(
    userId: string,
    filtre: Partial<IActionsFiltre>,
    size = 25,
    options: { export?: boolean } = {},
  ): Promise<PaginatedResponse<IAuditAction>> {
    return apiClientHttp.request<PaginatedResponse<IAuditAction>>({
      endpoint: '/api/erp/audit/actions',
      method: 'GET',
      params: nettoyer({
        module: filtre.module,
        typeAction: filtre.typeAction,
        recherche: filtre.recherche,
        depuis: filtre.depuis,
        jusqua: filtre.jusqua,
        page: filtre.page ?? 0,
        size,
        export: options.export ? 'true' : undefined,
      }),
      config: entete(userId),
    });
  },

  /**
   * Journal des connexions, déconnexions et échecs, paginé. Voir `actions` pour `export`.
   *
   * ORDRE DU JOURNAL : meme constat que `actions`, et meme endroit a corriger.
   * `AuditLectureResource.connexions()` construit lui aussi son `PageRequest` sans
   * `Sort`, l'onglet Connexions se lit donc du plus ancien au plus recent.
   */
  connexions(
    userId: string,
    filtre: Partial<IConnexionsFiltre>,
    size = 25,
    options: { export?: boolean } = {},
  ): Promise<PaginatedResponse<IConnexion>> {
    return apiClientHttp.request<PaginatedResponse<IConnexion>>({
      endpoint: '/api/erp/audit/connexions',
      method: 'GET',
      params: nettoyer({
        typeEvenement: filtre.typeEvenement,
        recherche: filtre.recherche,
        depuis: filtre.depuis,
        jusqua: filtre.jusqua,
        page: filtre.page ?? 0,
        size,
        export: options.export ? 'true' : undefined,
      }),
      config: entete(userId),
    });
  },

  /**
   * Modules présents dans le journal — alimente le filtre. La liste vient du
   * journal lui-même : un module livré demain y apparaît dès sa première action.
   */
  modules(userId: string): Promise<string[]> {
    return apiClientHttp.request<string[]>({
      endpoint: '/api/erp/audit/modules',
      method: 'GET',
      config: entete(userId),
    });
  },
};
