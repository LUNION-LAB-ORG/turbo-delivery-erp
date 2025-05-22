import React from 'react';
import Content from './content';
import { getDeliveryMen } from '@/src/actions/delivery-men.actions';
import { getTypePlats } from '@/src/actions/type-plats.actions';
import { getUsers } from '@/src/actions/users.actions';
import { getAllChiffreAffaire, getAllRestaurantChiffreAffaire } from '@/src/actions/statistiques.action';
import { ChiffreAffaireRestaurant } from '@/types/statistiques.model';
import { getRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function Page() {
  
  const [deliveryMen, restaurants, typePlats, users, chiffreAffaire, chiffresAffairesRestaurants] = await Promise.all([
    getDeliveryMen(),
    getRestaurants(0, 10),
    getTypePlats(),
    getUsers(),
    getAllChiffreAffaire(),
    getAllRestaurantChiffreAffaire({ dates: { start: null, end: null } }),
  ]);

  const initialItems = {
    deliveryMen,
    restaurants,
    typePlats,
    users,
    chiffreAffaire,
    chiffresAffairesRestaurants,
  };

  return <Content initialItems={initialItems} />;
}
