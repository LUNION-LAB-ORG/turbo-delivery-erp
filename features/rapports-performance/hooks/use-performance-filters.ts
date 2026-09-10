import { useQueryStates } from 'nuqs';
import { DateRange } from 'react-day-picker';

import {
  ModeSelection,
  performanceFiltersClient,
} from '@/features/rapports-performance/filters/performance.filters';

export function usePerformanceFilters() {
  const [filters, setFilters] = useQueryStates(
    performanceFiltersClient.filters,
    performanceFiltersClient.options,
  );

  /*
   * Le mode EFFECTIF, deduit quand l'URL ne l'ecrit pas.
   *
   * La precedence est celle du SERVEUR, mot pour mot : groupeId > restaurantIds >
   * restaurantId. Deux precedences differentes de part et d'autre du reseau feraient dire
   * « Groupe AGHA » a l'ecran pendant que le serveur agrege un seul restaurant, et rien
   * a l'ecran ne le detromperait.
   */
  const mode: ModeSelection =
    filters.mode ??
    (filters.groupeId ? 'GROUPE' : filters.restaurantIds.length > 0 ? 'MULTI' : 'UNITAIRE');

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      debut: performanceFiltersClient.filters.debut.defaultValue,
      fin: performanceFiltersClient.filters.fin.defaultValue,
      mode: null,
      restaurantId: performanceFiltersClient.filters.restaurantId.defaultValue,
      restaurantIds: performanceFiltersClient.filters.restaurantIds.defaultValue,
      groupeId: performanceFiltersClient.filters.groupeId.defaultValue,
    });
  };

  const handleDateChange = (value: DateRange | undefined) => {
    if (value?.from && value?.to) {
      setFilters((prev) => ({
        ...prev,
        debut: value.from!,
        fin: value.to!,
      }));
    }
  };

  const handleRestaurantChange = (restaurantId: string | null) => {
    setFilters((prev) => ({
      ...prev,
      restaurantId: restaurantId ?? '',
    }));
  };

  const handleRestaurantIdsChange = (restaurantIds: string[]) => {
    setFilters((prev) => ({ ...prev, mode: 'MULTI', restaurantIds }));
  };

  const handleGroupeChange = (groupeId: string | null) => {
    setFilters((prev) => ({ ...prev, mode: 'GROUPE', groupeId: groupeId ?? '' }));
  };

  /*
   * Changer de mode ne DETRUIT rien de ce que l'operateur a deja choisi.
   *
   * - vers UNITAIRE : le mode disparait de l'URL plutot que d'y etre ecrit. Le lien
   *   redevient alors exactement celui d'avant ce lot (`?debut=&fin=&restaurantId=`), donc
   *   partageable avec les memes destinataires qu'hier. Les autres selections sont videes,
   *   sans quoi elles reprendraient la main au prochain chargement, par precedence.
   * - vers MULTI : le partenaire unitaire deja choisi devient la premiere case cochee. Le
   *   perdre obligerait a le rechercher pour lui en ajouter un second, ce qui est
   *   precisement le geste qu'on vient de faire.
   * - vers GROUPE : `restaurantIds` est vide - il serait ecarte par le serveur et
   *   trainerait dans l'URL sans rien designer. `restaurantId` reste : c'est lui qui
   *   revient si l'operateur repasse en unitaire.
   */
  const handleModeChange = (nouveau: ModeSelection) => {
    if (nouveau === mode) return;

    if (nouveau === 'UNITAIRE') {
      setFilters((prev) => ({ ...prev, mode: null, restaurantIds: [], groupeId: '' }));
      return;
    }

    if (nouveau === 'MULTI') {
      setFilters((prev) => ({
        ...prev,
        mode: 'MULTI',
        groupeId: '',
        restaurantIds:
          prev.restaurantIds.length > 0
            ? prev.restaurantIds
            : prev.restaurantId
              ? [prev.restaurantId]
              : [],
      }));
      return;
    }

    setFilters((prev) => ({ ...prev, mode: 'GROUPE', restaurantIds: [] }));
  };

  return {
    filters,
    mode,
    updateFilters,
    clearFilters,
    handleDateChange,
    handleRestaurantChange,
    handleRestaurantIdsChange,
    handleGroupeChange,
    handleModeChange,
    setFilters,
  };
}
