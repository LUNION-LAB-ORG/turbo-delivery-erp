'use client';

import { ComboBox, Input, ListBox } from '@heroui-v3/react';

/** Un groupe, tel que le selecteur a besoin de le connaitre. */
export interface OptionGroupe {
  id: string;
  nom: string;
  nbEtablissements: number;
}

interface SelecteurGroupeProps {
  options: OptionGroupe[];
  value?: string;
  onChange: (value?: string) => void;
  isLoading?: boolean;
  /**
   * La liste n'a pas pu etre lue. Cas courant et non exceptionnel : la liste des groupes
   * est reservee a la Direction, aux administrateurs et aux Ops Managers, et un compte
   * Finance recoit un 403.
   */
  isError?: boolean;
}

/**
 * Le choix d'un GROUPE de partenaires deja constitue dans l'ERP.
 *
 * <p>Source : `GET /api/erp/partenaire/groupes`, la meme liste que l'ecran
 * d'administration des groupes (`features/groupes-partenaires`). Aucun endpoint n'a ete
 * invente pour ce lot.</p>
 *
 * <p>Une ComboBox, et non un Select nu : c'est ce qui se cherche au clavier, et la regle
 * du depot vaut ici comme ailleurs. Le nombre d'etablissements figure a cote du nom : sans
 * lui, un groupe vide se choisit sans qu'on puisse le distinguer d'un autre, et l'ecran
 * qui suit est a zero sans raison visible.</p>
 */
export function SelecteurGroupe({
  isError = false,
  isLoading = false,
  onChange,
  options,
  value,
}: SelecteurGroupeProps) {
  /*
   * L'echec de lecture ne se tait pas et ne se deguise pas en liste vide : « aucun groupe »
   * se lit comme un fait etabli, alors que la seule chose etablie est qu'on n'a pas pu
   * regarder. Le champ reste monte pour qu'un identifiant deja present dans l'URL continue
   * de piloter le rapport.
   */
  const placeholder = isError
    ? 'Liste des groupes illisible'
    : isLoading
      ? 'Chargement…'
      : options.length === 0
        ? 'Aucun groupe constitué'
        : 'Sélectionner un groupe';

  return (
    <div className="flex flex-col gap-1">
      <ComboBox
        aria-label="Groupe de partenaires"
        className="w-72"
        isDisabled={isLoading || isError || options.length === 0}
        onSelectionChange={(c) => onChange(c ? String(c) : undefined)}
        selectedKey={value ?? null}
      >
        <ComboBox.InputGroup>
          <Input placeholder={placeholder} />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox items={options}>
            {(o: OptionGroupe) => (
              <ListBox.Item id={o.id} textValue={o.nom}>
                <span className="flex w-full items-center justify-between gap-3">
                  <span className="truncate">{o.nom}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {o.nbEtablissements} établissement{o.nbEtablissements > 1 ? 's' : ''}
                  </span>
                </span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      {isError && (
        <p className="text-xs text-muted">
          La liste des groupes est réservée à la Direction, aux administrateurs et aux Ops
          Managers.
        </p>
      )}
    </div>
  );
}
