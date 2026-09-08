'use client';

import React from 'react';

import { ChampListeMultiple } from '@/components/commons/champs-formulaire';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';

/**
 * Le filtre par categorie de depense.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un `react-select`, une QUATRIEME bibliotheque d'interface dans un projet qui
 * en portait deja trois. Elle n'avait ici aucune raison d'etre : le choix multiple
 * cherchable existe en partage sous `ChampListeMultiple`, monte sur la meme `ComboBox`
 * que tous les autres champs de l'ERP.</p>
 *
 * <p>Ce que le remplacement apporte, au-dela de la coherence : `react-select` porte ses
 * propres couleurs, qui ne suivent PAS le theme. En theme sombre le champ restait blanc,
 * et sa liste deroulante aussi. Et les categories retenues n'y etaient lisibles que dans
 * la boite elle-meme ; elles sont maintenant des etiquettes, chacune avec son bouton de
 * retrait.</p>
 */
export function CategoriesSelectFilter({
  onCategoriesChange,
  selectedCategories,
}: {
  onCategoriesChange: (categories: null | string[]) => void;
  selectedCategories: string[];
}) {
  const { categories, isLoading } = useCategorieDepense();

  const options = React.useMemo(
    () => categories.map((c) => ({ label: c.nomCategorie, value: String(c.id) })),
    [categories],
  );

  return (
    <div className="w-full max-w-sm">
      <ChampListeMultiple
        label="Catégories"
        onChange={(valeurs) => onCategoriesChange(valeurs.length > 0 ? valeurs : null)}
        options={options}
        placeholder={isLoading ? 'Chargement…' : 'Choisir une catégorie…'}
        valeurs={selectedCategories ?? []}
      />
    </div>
  );
}
