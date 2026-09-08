'use client';

import { ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { FolderTree, ReceiptText } from 'lucide-react';
import React from 'react';

import { DepenseTable } from './index';
import { CategorieDepenseList } from '@/features/depenses/components/depense-list/categorie-depense';

const ONGLETS = [
  { icone: ReceiptText, id: 'depenses', libelle: 'Liste des dépenses' },
  { icone: FolderTree, id: 'categories', libelle: 'Liste des catégories' },
] as const;

/**
 * Les deux vues de la page des depenses.
 *
 * <p>Les onglets etaient deux boutons peints en ROUGE DE MARQUE une fois actifs, sur une
 * grille de deux colonnes pleine largeur : un onglet ne demande rien, il dit ou l'on est.
 * `ToggleButtonGroup` et non `Tabs` : `Tabs.Indicator` de la v3 fait tomber la page, et
 * sans lui l'onglet actif ne se distingue que par une nuance de gris.</p>
 *
 * <p>Les deux panneaux restent MONTES, caches par `hidden` : l'ancien `Tabs` demontait le
 * panneau inactif, si bien que revenir sur les depenses relancait la requete de la periode
 * et repartait d'un ecran de chargement.</p>
 */
export default function DepenseTabs() {
  const [onglet, setOnglet] = React.useState<string>('depenses');

  return (
    <div className="space-y-4">
      <ToggleButtonGroup
        className="flex-wrap"
        onSelectionChange={(sel) => setOnglet(String(Array.from(sel)[0] ?? 'depenses'))}
        selectedKeys={new Set([onglet])}
        selectionMode="single"
      >
        {ONGLETS.map((o) => (
          <ToggleButton id={o.id} key={o.id}>
            <o.icone aria-hidden="true" className="size-4" />
            {o.libelle}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <div hidden={onglet !== 'depenses'}>
        <DepenseTable />
      </div>
      <div hidden={onglet !== 'categories'}>
        <CategorieDepenseList />
      </div>
    </div>
  );
}
