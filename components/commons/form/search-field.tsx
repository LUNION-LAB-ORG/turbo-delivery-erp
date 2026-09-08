'use client';

import { Label, SearchField as ChampRecherche } from '@heroui-v3/react';

/**
 * Le champ de recherche pose au-dessus d'une liste.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un `Input` de la SECONDE bibliotheque, avec une loupe positionnee en absolu
 * par-dessus et un anneau de focus ecrit en `ring-gray-300` : une couleur figee, qui ne
 * suit ni le theme ni le mode sombre. Le champ de la v3 porte sa loupe, son anneau et son
 * bouton d'effacement.</p>
 *
 * <p>Ce bouton est un gain reel : les trois ecrans qui montent ce champ n'offraient aucun
 * moyen de revenir a la liste complete sans effacer la saisie caractere par caractere. La
 * touche Echap le fait aussi, desormais.</p>
 *
 * <p>Le champ garde son nom accessible meme sans intitule visible : sans lui, la loupe
 * seule ne dit rien a un lecteur d'ecran.</p>
 */

interface SearchFieldProps {
  /** Un intitule VISIBLE. Absent, le champ reste nomme pour les lecteurs d'ecran. */
  label?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchKey: string;
}

export function SearchField({
  label,
  onChange,
  placeholder = 'Rechercher',
  searchKey,
}: SearchFieldProps) {
  return (
    <ChampRecherche
      aria-label={label ? undefined : 'Rechercher'}
      className="w-full max-w-lg"
      onChange={onChange}
      value={searchKey ?? ''}
    >
      {label && <Label>{label}</Label>}
      <ChampRecherche.Group>
        <ChampRecherche.SearchIcon />
        <ChampRecherche.Input placeholder={placeholder} />
        <ChampRecherche.ClearButton />
      </ChampRecherche.Group>
    </ChampRecherche>
  );
}
