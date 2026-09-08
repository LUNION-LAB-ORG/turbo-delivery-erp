'use client';

import React from 'react';
import { Card } from '@heroui-v3/react';

import { FactureTable } from './facture-table';

interface FactureTabsContentProps {
  restoOpts: {
    label: string;
    value: string;
  }[];
  isOptionsLoading?: boolean;
}

/**
 * L'onglet « Toutes les factures » : une coquille autour du tableau.
 *
 * <p>La carte venait de shadcn, la derniere bibliotheque doublonnee du projet. Deux
 * filtres de restaurant etaient par ailleurs declares ici, un `useQueryStates` et un
 * `RestaurantSelect` importe, que rien ne rendait ni ne lisait : le filtre reel vit dans
 * `FactureTable`, qui recoit la liste des restaurants. Ils sont retires ; l'ecran ne
 * perd rien puisqu'ils n'etaient pas affiches.</p>
 */
export function FactureTabsContent({ restoOpts, isOptionsLoading }: FactureTabsContentProps) {
  return (
    <Card>
      <Card.Header>
        <Card.Title className="text-lg">Factures</Card.Title>
      </Card.Header>
      <Card.Content className="gap-4">
        <FactureTable restaurants={restoOpts} restaurantsLoading={isOptionsLoading} />
      </Card.Content>
    </Card>
  );
}
