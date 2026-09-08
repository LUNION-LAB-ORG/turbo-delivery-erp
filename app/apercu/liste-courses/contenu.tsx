'use client';

import React from 'react';

import Content from '@/app/(protected)/external_delivery/content';
import type { PaginatedResponse } from '@/types';
import type { CourseExterne, LivreurDisponible } from '@/types/models';

/**
 * La liste des courses externes, montée seule.
 *
 * <p>L'opérateur a demandé un TABLEAU sur poste et les cartes sur mobile. L'écran est
 * derrière l'authentification : sans ce banc, la demande ne serait vérifiée que par un
 * code qui compile, ce qui ne prouve rien sur une question de forme.</p>
 *
 * <p>Une course a plus de vingt-quatre heures d'attente, pour contrôler que la date
 * absolue est bien ÉCRITE et pas seulement posée dans une info-bulle.</p>
 */

const ilYA = (heures: number) => new Date(Date.now() - heures * 3600_000).toISOString();

const COURSE = (i: number, heures: number, statut: string): CourseExterne =>
  ({
    code: `CE-2609-${140 + i}`,
    commandes: [
      {
        destinataire: { contact: '+2250700000000', nomComplet: 'Yves Blanchard Koumassou' },
        fraisLivraison: 2000,
        numero: `ORD-260907-${79190 + i}`,
        prix: 3540,
        statut,
        zone: 'Nouvelle gare de Bingerville',
      },
    ] as CourseExterne['commandes'],
    createdAt: ilYA(heures),
    deliveredAt: '',
    id: `c-${i}`,
    nombreCommande: 1 + (i % 3),
    payoutAt: '',
    pickupAt: '',
    restaurant: { commune: 'Zone 4', id: `r-${i}`, nomEtablissement: 'CHICKEN NATION FAYA' },
    statut,
    total: 5540 + i * 1000,
  }) as unknown as CourseExterne;

const DONNEES: PaginatedResponse<CourseExterne> = {
  content: [
    COURSE(0, 0.1, 'EN_ATTENTE'),
    COURSE(1, 0.4, 'EN_ATTENTE'),
    COURSE(2, 30, 'EN_ATTENTE'),
    COURSE(3, 2, 'EN_COURS'),
  ],
  totalElements: 4,
  totalPages: 1,
} as unknown as PaginatedResponse<CourseExterne>;

const LIVREURS: LivreurDisponible[] = [];

export default function ApercuListeCourses() {
  return <Content delivers={LIVREURS} initialData={DONNEES} />;
}
