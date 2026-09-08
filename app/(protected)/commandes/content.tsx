'use client';

import type { Order, OrderStats, PageResponse, Restaurant } from '@/types/models';

import Orders from './components/orders';

/**
 * Coquille de l'ecran des commandes.
 *
 * <p>Elle portait un titre « Mes Commandes » peint en ROUGE DE MARQUE, alors que le fil
 * d'Ariane de la coquille annonce deja « Commandes / Client » juste au-dessus, et que
 * l'ecran ne montre pas les commandes de qui le regarde. Deux titres contradictoires
 * pour un meme ecran, dont un dans la couleur reservee a ce qui appelle un geste.</p>
 */
export default function Content({
  commandesInitiales,
  erreurInitiale,
  restaurants,
  stats,
}: {
  commandesInitiales: null | PageResponse<Order>;
  erreurInitiale: boolean;
  restaurants: Restaurant[];
  stats: null | OrderStats;
}) {
  return (
    <div className="flex h-full w-full flex-col gap-6 p-2 pb-4">
      <Orders
        commandesInitiales={commandesInitiales}
        erreurInitiale={erreurInitiale}
        restaurants={restaurants}
        stats={stats}
      />
    </div>
  );
}
