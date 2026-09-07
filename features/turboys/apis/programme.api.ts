import { apiClientHttp } from '@/lib/api-client-http';
import { IProgramme, ICreerProgrammePayload, IJourProgramme, IAutosuffisanceJour, IEtatCarburantSemaine } from '@/features/turboys/types/programme.types';

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

  async modifier(id: string, jours: IJourProgramme[]): Promise<IProgramme> {
    return apiClientHttp.request<IProgramme>({
      endpoint: `/api/erp/programmes/${id}`,
      method: 'PUT',
      data: { jours },
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
