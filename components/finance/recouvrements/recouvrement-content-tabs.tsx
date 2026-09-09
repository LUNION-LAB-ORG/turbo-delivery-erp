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
 * <p>La rangee ne ressemblait pas a des onglets mais a du texte pose cote a cote : la
 * selection ne changeait que la couleur du texte. Il manquait `Tabs.ListContainer`, qui
 * porte le groupe, et surtout une marque visible de l'onglet ouvert.</p>
 *
 * <h3>Pourquoi le trait est dessine a la main</h3>
 * <p>`Tabs.Indicator` est la piece prevue pour cela, et elle NE FONCTIONNE PAS dans ce
 * projet. Rendue telle quelle, elle leve `<SharedElement> must be rendered inside a
 * <SharedElementTransition>` et emporte la page entiere en 500 — mesure a l'ecran, pas
 * suppose. Enveloppee dans un `SharedElementTransition`, la page tient mais l'indicateur
 * ne rend RIEN : zero noeud `.tabs__indicator` dans le document, mesure aussi. Une piece
 * qui ne s'affiche pas ne sert a rien.</p>
 *
 * <p>Le trait est donc pose sur l'onglet lui-meme, en `data-[selected=true]`. Il prend
 * l'accent, et c'est legitime : il ne colorie pas une categorie, il dit ou l'on est.</p>
 *
 * <p>Variante `secondary` : conteneur plat. La `primary` fait suivre le trait a l'arrondi
 * de sa pastille, ce qui se voit et n'est pas beau.</p>
 */
/** Le trait de l'onglet ouvert. Voir le bloc ci-dessus : `Tabs.Indicator` est inutilisable. */
const MARQUE_ACTIVE =
  'border-b-2 border-transparent data-[selected=true]:border-accent data-[selected=true]:font-semibold';

const SECTIONS = [
  { id: 'factures', libelle: 'Toutes les factures' },
  { id: 'recouvrements', libelle: 'Recouvrements' },
  { id: 'accompte', libelle: 'Accompte' },
  { id: 'restaurants', libelle: 'Liste des restaurants' },
  { id: 'contestations', libelle: 'Contestations' },
];

function RecouvrementContentTabs() {
  const { filters, handleTabChange } = useRecouvrementDashboard();
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useDefinedRestaurantsQuery();
  const restoOpts = toRestaurantOptions(restaurants);

  return (
    <Tabs
      className="w-full"
      variant="secondary"
      onSelectionChange={(cle) => handleTabChange(String(cle) as RecouvrementTabsType)}
      selectedKey={filters.tab}
    >
      {/* Le conteneur gere lui-meme le debordement et sort ses chevrons : sur la fenetre
          reelle des postes (1000 px), cinq libelles ne tiennent pas sur une ligne. */}
      <Tabs.ListContainer>
        <Tabs.List>
          {SECTIONS.map((section) => (
            <Tabs.Tab className={MARQUE_ACTIVE} id={section.id} key={section.id}>
              {section.libelle}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>

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
