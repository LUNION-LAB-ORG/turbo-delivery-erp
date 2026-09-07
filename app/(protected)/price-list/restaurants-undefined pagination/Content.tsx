'use client';

import { PaginatedResponse } from '@/types';
import { RestaurantDefini } from '@/types/price-list';

import { ListeRestaurantsIndefinis } from '../_composants/liste-restaurants-indefinis';
import useContent from './useContent';

/**
 * ⚠ Cette route est un DOUBLON de `/price-list/restaurants-undefined`.
 *
 * <p>Son dossier s'appelle « restaurants-undefined pagination », espace compris : l'URL
 * réelle est donc `/price-list/restaurants-undefined%20pagination`, que personne ne
 * tape et vers laquelle aucun lien ne pointe. C'est une copie de travail laissée en
 * place, mais c'est bien une route servie. Elle est passée en v3 comme le reste ; sa
 * suppression est une décision de l'équipe, pas de la refonte.</p>
 */
export default function Content({
  initialData,
}: {
  initialData: null | PaginatedResponse<RestaurantDefini>;
}) {
  const { currentPage, data, fetchData, isLoading } = useContent({ initialData });

  return (
    <ListeRestaurantsIndefinis
      avecCommission
      enChargement={isLoading}
      onPage={fetchData}
      page={currentPage}
      restaurants={data?.content ?? []}
      totalPages={data?.totalPages ?? 1}
    />
  );
}
