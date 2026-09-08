'use client';

import React from 'react';
import { Tabs } from '@heroui-v3/react';

import { AccompteTabsContent } from '@/components/finance/recouvrements/accompte/accompte-tabs-content';
import { ContestationsTabsContent } from '@/components/finance/recouvrements/contestations/contestations-tabs-content';
import { FactureTabsContent } from '@/components/finance/recouvrements/factures/facture-tabs-content';
import { RecouvrementTable } from '@/components/finance/recouvrements/recouvrements/recouvrement-table';
import { RestaurantsTable } from '@/components/finance/recouvrements/restaurants/restaurants-table';
import useRecouvrementDashboard from '@/features/recouvrements/hooks/use-recouvrement-dashboard';
import { RecouvrementTabsType } from '@/features/recouvrements/types';
import { useDefinedRestaurantsQuery } from '@/features/restaurants/queries/restaurants.query';
import { toRestaurantOptions } from '@/features/restaurants/utils/restaurant-options';

/**
 * Les cinq sections du module Recouvrements.
 *
 * <h3>Ce qui change</h3>
 * <p>Les onglets venaient de shadcn, la derniere bibliotheque doublonnee du projet, et
 * chacun etait peint d'une couleur de palette differente : rouge, vert, violet, bleu,
 * jaune. Une couleur qui designe une CATEGORIE ne dit rien : elle n'annonce ni une
 * alerte, ni un succes, ni un geste. Ces cinq-la etaient par ailleurs des teintes fixes sans
 * variante sombre, donc du texte fonce sur fond pastel en theme sombre. L'onglet actif
 * se lit desormais a son etat, comme partout ailleurs dans l'ERP.</p>
 *
 * <p>PAS de `Tabs.Indicator` : il rend un `SharedElement` de react-aria qui LEVE hors
 * d'un `SharedElementTransition`, et fait tomber la page entiere.</p>
 */
function RecouvrementContentTabs() {
  const { filters, handleTabChange } = useRecouvrementDashboard();
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useDefinedRestaurantsQuery();
  const restoOpts = toRestaurantOptions(restaurants);

  return (
    <Tabs
      className="w-full"
      onSelectionChange={(cle) => handleTabChange(String(cle) as RecouvrementTabsType)}
      selectedKey={filters.tab}
    >
      {/* La rangee defile plutot que de pousser la page : sur la fenetre reelle des
          postes (1000 px), cinq libelles ne tiennent pas sur une ligne. */}
      <Tabs.List className="overflow-x-auto">
        <Tabs.Tab id="factures">Toutes les factures</Tabs.Tab>
        <Tabs.Tab id="recouvrements">Recouvrements</Tabs.Tab>
        <Tabs.Tab id="accompte">Accompte</Tabs.Tab>
        <Tabs.Tab id="restaurants">Liste des restaurants</Tabs.Tab>
        <Tabs.Tab id="contestations">Contestations</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel className="pt-4" id="factures">
        <FactureTabsContent restoOpts={restoOpts} isOptionsLoading={isRestaurantsLoading} />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="recouvrements">
        <RecouvrementTable restoOpts={restoOpts} isOptionsLoading={isRestaurantsLoading} />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="accompte">
        <AccompteTabsContent restoOpts={restoOpts} isOptionsLoading={isRestaurantsLoading} />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="restaurants">
        <RestaurantsTable restoOpts={restoOpts} isOptionsLoading={isRestaurantsLoading} />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="contestations">
        <ContestationsTabsContent restoOpts={restoOpts} isOptionsLoading={isRestaurantsLoading} />
      </Tabs.Panel>
    </Tabs>
  );
}

export default RecouvrementContentTabs;
