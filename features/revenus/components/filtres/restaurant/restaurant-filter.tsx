'use client';

import { useMemo } from 'react';

import { ChampListeMultiple } from '@/components/commons/champs-formulaire';
import { useLivraisonList } from '@/features/revenus/hooks/use-livraison-list';

/**
 * Le filtre par restaurant des revenus.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un `react-select`, la QUATRIEME bibliotheque d'interface du projet, et le
 * dernier fichier a l'utiliser. Elle disparait avec lui.</p>
 *
 * <p>Ce composant portait quatre-vingt-dix lignes de style en ligne, toutes en
 * hexadecimal ecrit a la main : `backgroundColor: 'white'`, `#dbeafe`, `#1e40af`,
 * `#d1d5db`, une ombre en `rgba` sur quatre valeurs. Aucune n'a de variante sombre, donc
 * en theme sombre le champ restait blanc, sa liste deroulante aussi, et les etiquettes
 * bleu clair sur bleu fonce. Le champ partage suit le theme.</p>
 *
 * <p>Chaque option portait par ailleurs une pastille bleue avec une icone de boutique et
 * le sous-titre « Restaurant », repete sous CHAQUE ligne d'une liste de restaurants dans
 * un filtre qui s'appelle deja « restaurants ». Une decoration qui ne dit rien.</p>
 */
export function RestaurantFilter({
  onRestaurantChange,
  selectedRestaurants,
}: {
  onRestaurantChange: (restaurantIds: string[]) => void;
  selectedRestaurants: string[];
}) {
  const { livraisons } = useLivraisonList();

  const options = useMemo(() => {
    if (!Array.isArray(livraisons)) return [];
    const noms = new Set<string>();
    livraisons.forEach((l) => {
      if (l.nomRestaurant) noms.add(l.nomRestaurant);
    });
    return Array.from(noms)
      .map((nom) => ({ label: nom, value: nom }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [livraisons]);

  return (
    <div className="w-full md:w-[350px]">
      <ChampListeMultiple
        label="Restaurants"
        onChange={onRestaurantChange}
        options={options}
        placeholder="Filtrer par restaurants…"
        valeurs={selectedRestaurants ?? []}
      />
    </div>
  );
}
