import { usePerformanceFilters } from '@/features/rapports-performance/hooks/use-performance-filters';
import { usePerformanceQuery } from '@/features/rapports-performance/queries/performance.query';
import { IPerformanceParams } from '@/features/rapports-performance/types/performance.type';

export const usePerformanceStats = () => {
  const { filters, mode } = usePerformanceFilters();

  /*
   * Le MODE decide de ce qui part, pas la presence des valeurs.
   *
   * Un `restaurantId` laisse dans l'URL par un passage anterieur en unitaire ne doit pas
   * accompagner une selection de groupe : il serait ecarte par le serveur, mais l'ecran
   * l'aurait tout de meme demande. Un mode sans valeur (multi sans case cochee, groupe
   * sans groupe choisi) n'envoie rien : le serveur repond alors GLOBAL, c'est-a-dire
   * exactement ce que la page affiche deja aujourd'hui quand aucun partenaire n'est choisi.
   */
  const selection: Partial<IPerformanceParams> =
    mode === 'GROUPE'
      ? filters.groupeId
        ? { groupeId: filters.groupeId }
        : {}
      : mode === 'MULTI'
        ? filters.restaurantIds.length > 0
          ? { restaurantIds: filters.restaurantIds }
          : {}
        : filters.restaurantId
          ? { restaurantId: filters.restaurantId }
          : {};

  const params: IPerformanceParams = {
    debut: filters.debut,
    fin: filters.fin,
    ...selection,
  };

  const { data, isLoading, isFetching, error, isError, refetch } = usePerformanceQuery(params);

  return {
    data,
    isLoading,
    // Expose pour bloquer le bouton « Reessayer » pendant la nouvelle tentative :
    // apres un echec la query reste en statut error, isLoading ne repasse plus a vrai.
    isFetching,
    error,
    isError,
    refetch,
  };
};
