import { apiClientHttp } from '@/lib/api-client-http';
import type { IAuditAction } from '@/features/supervision/types';
import {
  IProgramme,
  ICreerProgrammePayload,
  IModifierProgrammePayload,
  IAutosuffisanceJour,
  IEtatCarburantSemaine,
  IDupliquerSemainePayload,
  IDuplicationSemaine,
} from '@/features/turboys/types/programme.types';

/**
 * Programmes hebdomadaires (M2). Endpoints backend déployés. On mirrore le pattern
 * pointage : pas de `service` → baseURL par défaut (proxy /api/erp).
 */
export const programmeAPI = {
  async listerSemaine(annee: number, semaine: number): Promise<IProgramme[]> {
    return apiClientHttp.request<IProgramme[]>({
      endpoint: '/api/erp/programmes',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  async autosuffisance(annee: number, semaine: number): Promise<IAutosuffisanceJour[]> {
    return apiClientHttp.request<IAutosuffisanceJour[]>({
      endpoint: '/api/erp/programmes/autosuffisance',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  async detail(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}`,
      method: 'GET',
    });
  },

  async creer(payload: ICreerProgrammePayload): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: '/api/erp/programmes',
      method: 'POST',
      data: payload,
    });
  },

  async modifier(id: string, payload: Omit<IModifierProgrammePayload, 'id'>): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}`,
      method: 'PUT',
      data: {
        jours: payload.jours,
        siteModifie: payload.siteModifie ?? false,
        sitePartnerId: payload.sitePartnerId ?? null,
      },
    });
  },

  /** Copie une semaine entière vers une semaine vide ; 409 avec la raison sinon. */
  async dupliquerSemaine(payload: IDupliquerSemainePayload): Promise<IDuplicationSemaine> {
    return apiClientHttp.request<IDuplicationSemaine>({
      endpoint: '/api/erp/programmes/dupliquer',
      method: 'POST',
      data: payload,
    });
  },

  /** Renvoie le programme par WhatsApp, sans le republier. */
  async renvoyerWhatsApp(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/whatsapp`,
      method: 'POST',
    });
  },

  /** L'histoire d'un programme : qui a changé quoi, et quand. */
  async historique(id: string): Promise<IAuditAction[]> {
    return apiClientHttp.request<IAuditAction[]>({
      endpoint: `/api/erp/programmes/${id}/historique`,
      method: 'GET',
    });
  },

  async planifier(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/planifier`,
      method: 'POST',
    });
  },

  async publier(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/publier`,
      method: 'POST',
    });
  },

  async envoyer(id: string): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}/envoyer`,
      method: 'POST',
    });
  },

  async independants(annee: number, semaine: number): Promise<IProgramme[]> {
    return apiClientHttp.request<IProgramme[]>({
      endpoint: '/api/erp/programmes/independants',
      method: 'GET',
      params: { annee, semaine },
    });
  },

  async supprimer(id: string): Promise<void> {
    await apiClientHttp.request<void>({
      endpoint: `/api/erp/programmes/${id}`,
      method: 'DELETE',
    });
  },

  /** Carburant de la semaine : total publié, engagement existant, écart. */
  async etatCarburant(annee: number, semaine: number): Promise<IEtatCarburantSemaine> {
    return apiClientHttp.request<IEtatCarburantSemaine>({
      endpoint: '/api/erp/programmes/carburant',
      method: 'GET',
      params: { annee, semaine },
    });
  },
};
