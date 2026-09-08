'use client';

import { Button } from '@heroui-v3/react';
import { X } from 'lucide-react';

import FilterPeriode from '../periode/filter-periode';
import { RestaurantFilter } from '../restaurant/restaurant-filter';

/**
 * La barre de filtres des revenus sur les livraisons.
 *
 * <h3>Ce qui change</h3>
 * <p>Le bouton d'effacement venait de shadcn et écoutait `onClick`. Celui de la v3
 * écoute `onPress` et ignore `onClick` EN SILENCE : converti mécaniquement, ce bouton
 * serait resté à l'écran, survolable et enfonçable, sans jamais rien effacer.</p>
 *
 * <p>La rangée basculait en colonne sous `lg` (1024 px). La fenêtre réelle des postes
 * fait environ 1000 px : ce seuil ne s'ouvrait jamais, et les filtres s'empilaient en
 * hauteur sur TOUS les postes. Le seuil passe à `md`.</p>
 *
 * <p>Les deux filtres portent maintenant un libellé : ils s'alignent donc par le BAS,
 * faute de quoi le champ sans libellé remonterait d'une ligne.</p>
 */
export function RevenusFilters({
    onClearFilters,
    onRestaurantChange,
    selectedRestaurants,
}: {
    onClearFilters: () => void;
    onRestaurantChange: (restaurantIds: string[]) => void;
    selectedRestaurants: string[];
}) {
    const filtresActifs = selectedRestaurants.length > 0;

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-end gap-3">
                <RestaurantFilter
                    onRestaurantChange={onRestaurantChange}
                    selectedRestaurants={selectedRestaurants}
                />

                <FilterPeriode />
            </div>

            {/* Un retrait, pas un geste principal : il n'a ni contour ni couleur. */}
            {filtresActifs && (
                <Button onPress={onClearFilters} size="sm" variant="ghost">
                    <X aria-hidden="true" className="size-4" />
                    Effacer les filtres
                </Button>
            )}
        </div>
    );
}
