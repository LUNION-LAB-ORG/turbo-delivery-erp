'use client';

import { ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';

import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import type { ModeSelection } from '@/features/rapports-performance/filters/performance.filters';
import type { RestaurantOption } from '@/features/restaurants';

import { OptionGroupe, SelecteurGroupe } from './selecteur-groupe';
import { SelecteurMultiPartenaires } from './selecteur-multi-partenaires';

interface SelecteurSelectionProps {
  mode: ModeSelection;
  onModeChange: (mode: ModeSelection) => void;

  /** Mode UNITAIRE : le comportement d'avant ce lot, a l'identique. */
  restaurantId?: string;
  onRestaurantChange: (value?: string) => void;

  /** Mode MULTI. */
  restaurantIds: string[];
  onRestaurantIdsChange: (ids: string[]) => void;
  restaurants: RestaurantOption[];
  restaurantsEnChargement?: boolean;

  /** Mode GROUPE. */
  groupeId?: string;
  onGroupeChange: (value?: string) => void;
  groupes: OptionGroupe[];
  groupesEnChargement?: boolean;
  groupesEnErreur?: boolean;
}

const LIBELLES_MODE: Record<ModeSelection, string> = {
  UNITAIRE: 'Un partenaire',
  MULTI: 'Plusieurs',
  GROUPE: 'Groupe',
};

/**
 * Le selecteur a TROIS MODES du rapport de performance.
 *
 * <h3>Les trois questions</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : sur QUOI porte le rapport. C'est la premiere
 *       chose qu'un lecteur verifie avant de croire un chiffre, et elle etait portee par un
 *       seul champ qui ne savait dire qu'un partenaire a la fois.</li>
 *   <li><b>Ce qui appelle un geste</b> : le mode, puis le choix dans ce mode. Deux gestes
 *       enchaines, donc deux controles cote a cote, jamais un seul champ qui changerait de
 *       nature sans prevenir.</li>
 *   <li><b>La forme naturelle</b> : trois etats exclusifs se disent par une bascule a trois
 *       positions, ou l'on voit les deux autres possibilites sans avoir a ouvrir un menu.
 *       Le controle du mode choisi apparait a cote, et lui seul.</li>
 * </ul>
 *
 * <p>Ce composant est PRESENTATIONNEL : il recoit ses listes et ne lit rien du reseau.
 * C'est ce qui permet au banc `app/apercu/rapports-performance` de montrer les quatre cas
 * de selection - multi, groupe, groupe vide, groupe inconnu - sans session ni serveur.</p>
 *
 * <p>⚠ `RestaurantSelect` reste STRICTEMENT celui des recouvrements, non modifie : en mode
 * unitaire, l'ecran se comporte comme avant ce lot, et les liens `?restaurantId=` deja
 * partages continuent de fonctionner sans rien reecrire.</p>
 */
export function SelecteurSelection({
  groupeId,
  groupes,
  groupesEnChargement = false,
  groupesEnErreur = false,
  mode,
  onGroupeChange,
  onModeChange,
  onRestaurantChange,
  onRestaurantIdsChange,
  restaurantId,
  restaurantIds,
  restaurants,
  restaurantsEnChargement = false,
}: SelecteurSelectionProps) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      {/*
       * `ToggleButtonGroup` en selection simple : le mode est un choix EXCLUSIF, et
       * react-aria en tire le role `radiogroup`, la navigation aux fleches et l'etat
       * `aria-checked`. Trois boutons ordinaires auraient l'air pareil et n'annonceraient
       * rien.
       */}
      <ToggleButtonGroup
        aria-label="Portée du rapport"
        onSelectionChange={(cles) => {
          const choisi = Array.from(cles)[0];
          if (choisi) onModeChange(String(choisi) as ModeSelection);
        }}
        selectedKeys={new Set([mode])}
        selectionMode="single"
      >
        {(Object.keys(LIBELLES_MODE) as ModeSelection[]).map((m) => (
          <ToggleButton id={m} key={m}>
            {LIBELLES_MODE[m]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {mode === 'UNITAIRE' && (
        <RestaurantSelect
          className="w-72"
          isDisabled={restaurantsEnChargement}
          onChange={onRestaurantChange}
          value={restaurantId}
        />
      )}

      {mode === 'MULTI' && (
        <SelecteurMultiPartenaires
          isLoading={restaurantsEnChargement}
          onChange={onRestaurantIdsChange}
          options={restaurants}
          value={restaurantIds}
        />
      )}

      {mode === 'GROUPE' && (
        <SelecteurGroupe
          isError={groupesEnErreur}
          isLoading={groupesEnChargement}
          onChange={onGroupeChange}
          options={groupes}
          value={groupeId}
        />
      )}
    </div>
  );
}
