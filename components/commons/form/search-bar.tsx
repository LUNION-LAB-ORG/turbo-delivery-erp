'use client';

import { ComboBox, Input, Label, ListBox } from '@heroui-v3/react';
import React from 'react';

/**
 * Une barre de recherche a suggestions.
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait un `Input` de la SECONDE bibliotheque, une liste `<ul>` posee en absolu
 * dessous, et un `onBlur` qui la fermait apres 200 ms d'attente pour laisser passer le
 * clic. Rien n'y repondait au clavier : ni fleches, ni Entree, ni Echap, et le lecteur
 * d'ecran n'annoncait ni la liste ni le nombre de resultats. C'est exactement une
 * `ComboBox` : elle filtre, elle se parcourt au clavier, et sa fermeture ne depend plus
 * d'une temporisation.</p>
 *
 * <p>La saisie libre est conservee (`allowsCustomValue`) : on peut chercher un terme qui
 * n'est dans aucune suggestion, ce que la liste d'origine permettait aussi.</p>
 */

interface SearchBarProps {
  /** Les suggestions proposees sous le champ. */
  items: readonly string[];
  label?: string;
  /**
   * Ce que l'ecran fait du texte saisi.
   *
   * <p>Optionnel, et personne ne le branche pour l'instant : la barre du releve de paie
   * ne filtre RIEN. Le defaut est anterieur a cette bascule, il se corrige la ou la liste
   * est rendue.</p>
   */
  onChange?: (valeur: string) => void;
  placeholder?: string;
}

export function SearchBar({
  items,
  label = 'Rechercher',
  onChange,
  placeholder = 'Rechercher',
}: SearchBarProps) {
  const [saisie, setSaisie] = React.useState('');

  const propager = (valeur: string) => {
    setSaisie(valeur);
    onChange?.(valeur);
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <ComboBox
        allowsCustomValue
        inputValue={saisie}
        onInputChange={propager}
        onSelectionChange={(cle) => cle != null && propager(String(cle))}
      >
        <Label>{label}</Label>
        <ComboBox.InputGroup>
          <Input placeholder={placeholder} />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox
            items={items.map((item) => ({ id: item }))}
            renderEmptyState={() => (
              <p className="px-3 py-2 text-sm text-muted">Aucune suggestion</p>
            )}
          >
            {(item: { id: string }) => (
              <ListBox.Item id={item.id} textValue={item.id}>
                {item.id}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </div>
  );
}
