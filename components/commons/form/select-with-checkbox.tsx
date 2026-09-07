'use client';

import { Button, Checkbox, Popover } from '@heroui-v3/react';

interface SelectWithCheckboxProps {
  className?: string;
  confirmer?: () => void;
  disabled?: boolean;
  onChange?: (selectedOptions: any) => void;
  options: any[];
  placeholder?: string;
  selected: string[];
  setSelected: (selected: any) => void;
}

/**
 * Un choix multiple d'utilisateurs, dans un panneau flottant.
 *
 * <h3>Ce qui change</h3>
 * <p>Le panneau était entièrement peint en ROUGE : bordure `border-red-300`, titre
 * « Sélection » en `text-red-500`, cases à cocher en `color="danger"`, bouton
 * « Confirmer » en danger. Cocher des noms dans une liste n'a rien de dangereux, et le
 * rouge y était la couleur par défaut de l'écran plutôt qu'un signal.</p>
 *
 * <p>Le bouton « Annuler » n'avait AUCUN gestionnaire : il était pleinement actif, à côté
 * de « Confirmer », et ne faisait rien. Il vide maintenant la sélection, ce qui est le
 * seul sens qu'il puisse avoir dans un panneau que la touche Échap ferme déjà.</p>
 *
 * <p>Le déclencheur affichait la liste des noms retenus bout à bout, séparés par des
 * virgules, dans un bouton de largeur fixe : au-delà de deux noms, le texte débordait.
 * Il annonce leur nombre, et les noms restent cochés dans le panneau.</p>
 */
export function SelectWithCheckbox(props: SelectWithCheckboxProps) {
  const toggleSelection = (name: string) => {
    props.setSelected((prev: string[]) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };

  const resume =
    props.selected.length === 0
      ? (props.placeholder ?? 'Sélectionner des utilisateurs')
      : `${props.selected.length} sélectionné${props.selected.length > 1 ? 's' : ''}`;

  return (
    <Popover>
      <Button className="w-64" isDisabled={props.disabled} variant="outline">
        {resume}
      </Button>
      <Popover.Content className="w-72">
        <Popover.Dialog className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold text-foreground">Sélection</p>
          <div className="flex flex-col gap-2">
            {props.options.map(({ name }) => (
              <Checkbox
                isSelected={props.selected.includes(name)}
                key={name}
                onChange={() => toggleSelection(name)}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <span className="flex-1 text-sm text-foreground">{name}</span>
                </Checkbox.Content>
              </Checkbox>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              isDisabled={props.selected.length === 0}
              onPress={() => props.setSelected([])}
              variant="ghost"
            >
              Tout décocher
            </Button>
            <Button onPress={props.confirmer} variant="primary">
              Confirmer
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
