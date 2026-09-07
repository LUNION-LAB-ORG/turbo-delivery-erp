'use client';

import React from 'react';

import { Progression } from '@/types/performance-creneauId';

import { TableauProgression } from './tableau-progression';

/**
 * ⚠ Tableau de PLACE TENANTE : ses quatre jours sont écrits en dur, à zéro.
 *
 * <p>Il est rendu DEUX FOIS côte à côte sur l'aperçu de performance d'un livreur, avec
 * « À venir » dans la colonne de progression et « -- » dans celle des commissions. Ce ne
 * sont pas des données : c'est une maquette laissée en place, servie en production.</p>
 *
 * <p>La refonte le passe en v3 et lui donne son état « à venir » explicite, mais ne peut
 * pas lui inventer une source. Le brancher ou le retirer est une décision de l'équipe.</p>
 */
const JOURS_PLACE_TENANTE: Progression[] = [
  { commission: 0, heure: 0, jour: 'LUNDI', progression: 0 },
  { commission: 0, heure: 0, jour: 'MARDI', progression: 0 },
  { commission: 0, heure: 0, jour: 'MERCREDI', progression: 0 },
  { commission: 0, heure: 0, jour: 'JEUDI', progression: 0 },
];

export default function FakeTableCreneau() {
  return <TableauProgression aVenir jours={JOURS_PLACE_TENANTE} />;
}
