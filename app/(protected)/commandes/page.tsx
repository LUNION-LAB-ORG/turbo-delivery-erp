export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';

import Loading from '@/components/layouts/loading';
import { getAllOrders, getOrdersStats } from '@/src/actions/commandes.actions';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

import Content from './content';

/**
 * Une lecture qui echoue ne doit plus emporter l'ecran entier.
 *
 * <h3>Ce qui se passait</h3>
 * <p>Les trois lectures etaient attendues sans filet, et `getAllOrders` RELANCE son
 * exception. N'importe quel refus du service client faisait donc echouer le rendu du
 * composant serveur, et l'ERP affichait « Les commandes n'a pas pu s'afficher » a la
 * place de tout l'ecran : ni filtres, ni barre d'outils, ni chiffres, rien.</p>
 *
 * <p>Le composant client sait pourtant deja dire l'echec a sa place et proposer une
 * relance. Chaque lecture est donc gardee separement : les restaurants et les chiffres
 * peuvent manquer sans que la liste disparaisse, et l'echec de la liste est ANNONCE au
 * composant plutot que devine — sans quoi une liste absente se lirait « aucune
 * commande », ce qui est faux.</p>
 */
export default async function Page() {
  const [commandes, restaurants, stats] = await Promise.all([
    getAllOrders().catch(() => null),
    getAllRestaurants().catch(() => []),
    getOrdersStats().catch(() => null),
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <Content
        commandesInitiales={commandes}
        erreurInitiale={commandes === null}
        restaurants={restaurants}
        stats={stats}
      />
    </Suspense>
  );
}
