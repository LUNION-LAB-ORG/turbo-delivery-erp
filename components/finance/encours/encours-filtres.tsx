'use client';

import { Button, ComboBox, Input, Label, ListBox } from '@heroui-v3/react';
import { RotateCcw } from 'lucide-react';

import { MOIS_LONGS } from '@/features/encours';

import { EncoursStoreFilter } from './encours-store-filter';

const anneeCourante = new Date().getFullYear();
const ANNEES = [anneeCourante, anneeCourante - 1, anneeCourante - 2, anneeCourante - 3];
const MOIS = Array.from({ length: 12 }, (_, i) => i + 1);
const CYCLES = [
  { key: 'TOUS', label: 'Tous' },
  { key: 'MENSUEL', label: 'Mensuel' },
  { key: 'QUINZAINE', label: 'Quinzaine' },
  { key: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
];

/** Les cinq filtres de l'ecran. Chaine vide = « Tous », `stores` vide = tous les points. */
export interface IEncoursFiltresValeurs {
  annee: number;
  cycle: string;
  mois: string;
  partenaire: string;
  stores: string[];
}

/**
 * La barre de filtres du releve.
 *
 * <h3>Le vide blanc du haut</h3>
 * <p>Les filtres etaient poses dans une `Card`, avec `grid … sm:flex sm:flex-wrap` pour
 * className. Or la classe `card__content` de HeroUI v3 applique `flex-direction: column`,
 * et rien dans cette liste ne la contredisait : `sm:flex` ne change que `display`. Les
 * filtres se sont donc empiles en COLONNE, et `items-end` - pense pour aligner des champs
 * sur une ligne - les a pousses sur le bord DROIT de la carte. D'ou un bloc blanc de la
 * largeur de l'ecran et de la hauteur de quatre champs, avant le premier chiffre. La
 * barre tient maintenant sur une ligne, dans un `div` en `flex-row` explicite et hors
 * carte : plus rien n'impose de direction contre laquelle lutter.</p>
 *
 * <p>Composant a part, et non un bloc de `encours-view` : c'est la seule facon de le
 * monter sur le banc d'apercu. Tant qu'il vivait dans la vue, qui lit le reseau, le banc
 * ne pouvait montrer que les blocs situes SOUS la barre - c'est-a-dire tout sauf le
 * defaut que ce lot corrige.</p>
 *
 * <p>Des `ComboBox` et non des `Select` : la liste des partenaires suit le portefeuille
 * et se cherche, comme partout ailleurs dans ce projet.</p>
 */
export function EncoursFiltres({
  groupes,
  onChange,
  valeurs,
}: {
  /** Groupes partenaires proposes par le filtre. */
  groupes: string[];
  onChange: (partiel: Partial<IEncoursFiltresValeurs>) => void;
  valeurs: IEncoursFiltresValeurs;
}) {
  const filtresActifs =
    Boolean(valeurs.mois) ||
    Boolean(valeurs.cycle) ||
    Boolean(valeurs.partenaire) ||
    valeurs.stores.length > 0;

  return (
    <div className="flex flex-row flex-wrap items-end gap-2 border-b border-separator pb-2">
      <ComboBox
        className="w-[7rem]"
        onSelectionChange={(c) => {
          if (c) onChange({ annee: Number(c) });
        }}
        selectedKey={String(valeurs.annee)}
      >
        <Label>Année</Label>
        <ComboBox.InputGroup>
          <Input />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox items={ANNEES.map((y) => ({ cle: String(y) }))}>
            {(o: { cle: string }) => (
              <ListBox.Item id={o.cle} textValue={o.cle}>
                {o.cle}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      <ComboBox
        className="w-[11rem]"
        onSelectionChange={(c) => onChange({ mois: c === 'TOUS' ? '' : String(c ?? '') })}
        selectedKey={valeurs.mois || 'TOUS'}
      >
        <Label>Mois</Label>
        <ComboBox.InputGroup>
          <Input />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox
            items={[
              { cle: 'TOUS', libelle: 'Tous (cumul annuel)' },
              ...MOIS.map((m) => ({ cle: String(m), libelle: MOIS_LONGS[m] })),
            ]}
          >
            {(o: { cle: string; libelle: string }) => (
              <ListBox.Item id={o.cle} textValue={o.libelle}>
                {o.libelle}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      <ComboBox
        className="w-[10rem]"
        onSelectionChange={(c) => onChange({ cycle: c === 'TOUS' ? '' : String(c ?? '') })}
        selectedKey={valeurs.cycle || 'TOUS'}
      >
        <Label>Cycle</Label>
        <ComboBox.InputGroup>
          <Input />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox items={CYCLES}>
            {(o: { key: string; label: string }) => (
              <ListBox.Item id={o.key} textValue={o.label}>
                {o.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      <ComboBox
        className="w-[14rem]"
        // changer de partenaire reinitialise la selection de points de vente (§4)
        onSelectionChange={(c) =>
          onChange({ partenaire: c === 'TOUS' ? '' : String(c ?? ''), stores: [] })
        }
        selectedKey={valeurs.partenaire || 'TOUS'}
      >
        <Label>Partenaire</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Rechercher…" />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox
            items={[{ cle: 'TOUS', libelle: 'Tous' }, ...groupes.map((g) => ({ cle: g, libelle: g }))]}
          >
            {(o: { cle: string; libelle: string }) => (
              <ListBox.Item id={o.cle} textValue={o.libelle}>
                {o.libelle}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      <EncoursStoreFilter
        onChange={(ids) => onChange({ stores: ids })}
        partenaire={valeurs.partenaire}
        value={valeurs.stores}
      />

      {/* Revenir au cumul annuel demandait de remettre quatre champs sur « Tous ». */}
      {filtresActifs && (
        <Button
          onPress={() => onChange({ cycle: '', mois: '', partenaire: '', stores: [] })}
          size="sm"
          variant="ghost"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Tout le portefeuille
        </Button>
      )}
    </div>
  );
}
