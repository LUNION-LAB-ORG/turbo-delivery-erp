'use client';

import { Tabs } from '@heroui-v3/react';
import React from 'react';

/**
 * Banc des onglets.
 *
 * <p>L'écran Recouvrements rendait ses cinq sections comme du texte posé côte à côte,
 * sans rien qui dise laquelle est ouverte. Deux pièces manquaient : `Tabs.ListContainer`
 * et `Tabs.Indicator`. Les deux variantes sont montées ici pour trancher laquelle
 * convient.</p>
 */

const SECTIONS = [
  { id: 'factures', libelle: 'Toutes les factures' },
  { id: 'recouvrements', libelle: 'Recouvrements' },
  { id: 'accompte', libelle: 'Accompte' },
  { id: 'restaurants', libelle: 'Liste des restaurants' },
  { id: 'contestations', libelle: 'Contestations' },
];

function Rangee({ variante }: { variante: 'primary' | 'secondary' }) {
  return (
    <div className="mb-8 rounded-xl border border-default-200 bg-surface p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        variant = {variante}
      </p>
      <Tabs className="w-full" defaultSelectedKey="factures" variant={variante}>
        <Tabs.ListContainer>
          <Tabs.List>
            {SECTIONS.map((s) => (
              <Tabs.Tab
                className="border-b-2 border-transparent data-[selected=true]:border-accent data-[selected=true]:font-semibold"
                id={s.id}
                key={s.id}
              >
                {s.libelle}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {SECTIONS.map((s) => (
          <Tabs.Panel className="pt-4" id={s.id} key={s.id}>
            <p className="text-sm text-muted">Contenu de « {s.libelle} ».</p>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}

export default function ApercuOnglets() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Banc des onglets</h1>
      <Rangee variante="secondary" />
      <Rangee variante="primary" />
    </div>
  );
}
