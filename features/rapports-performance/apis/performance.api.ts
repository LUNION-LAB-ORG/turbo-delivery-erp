import { apiClientHttp } from '@/lib/api-client-http';
import { IDashboardData, IPerformanceParams } from '@/features/rapports-performance/types/performance.type';

export interface IPerformanceAPI {
  obtenirPerformance(params: IPerformanceParams): Promise<IDashboardData>;
}

export const performanceAPI: IPerformanceAPI = {
  async obtenirPerformance(params: IPerformanceParams): Promise<IDashboardData> {
    const queryParams: Record<string, string> = {
      debut: params.debut.toISOString().split('T')[0],
      fin: params.fin.toISOString().split('T')[0],
    };

    /*
     * UN SEUL parametre de selection part, jamais deux.
     *
     * Le serveur accepte les trois ensemble et tranche par precedence sans rendre 400,
     * mais il rend alors dans `selection.parametresIgnores` ce qu'il a ecarte : un ecran
     * qui envoie tout et lit le reste ferait dependre son affichage d'un arbitrage qu'il
     * n'a pas fait. La precedence est reproduite ICI, a l'identique, pour que la question
     * ne se pose pas - ce qui est envoye est ce qui est demande.
     *
     * ⚠ UN SEUL APPEL SERT TOUT L'ECRAN. Ne pas boucler cet endpoint par partenaire pour
     * fabriquer le detail par store : le serveur le sert dans `parStore`, sur LA MEME
     * lecture de la base, ce qui est la seule facon que les lignes somment les totaux de
     * tete au franc pres.
     */
    if (params.groupeId) {
      queryParams.groupeId = params.groupeId;
    } else if (params.restaurantIds && params.restaurantIds.length > 0) {
      // La forme repetee marche aussi cote serveur ; une seule occurrence separee par des
      // virgules garde l'URL du reseau lisible dans le journal.
      queryParams.restaurantIds = params.restaurantIds.join(',');
    } else if (params.restaurantId) {
      queryParams.restaurantId = params.restaurantId;
    }

    return await apiClientHttp.request<IDashboardData>({
      endpoint: `/api/erp/analytics/performance`,
      method: 'GET',
      params: queryParams,
    });
  },
};
