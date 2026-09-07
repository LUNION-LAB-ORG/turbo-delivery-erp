'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import type { LivreurTrafic, QuartierZone } from '@/types/models';

/**
 * Monte la carte du trafic, seule.
 *
 * <p>`/trafic` et `/trafic/standard` sont derrière l'authentification : impossible de les
 * regarder sans un compte. Ce banc monte le composant de carte exactement comme le fait
 * l'écran — `dynamic` avec `ssr: false` — pour vérifier qu'il se charge et s'affiche.</p>
 *
 * <p>Il a servi à contrôler que le retrait des paquets Leaflet ne touche pas la carte.
 * Elle est sur Google Maps depuis la migration ; Leaflet n'était plus importé nulle
 * part. Sans `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, le composant rend son propre message
 * d'indisponibilité : c'est déjà la preuve que le module se charge.</p>
 */

const MapTrafic = dynamic(() => import('@/components/dashboard/trafic/MapTrafic'), { ssr: false });

const POSITIONS: LivreurTrafic[] = [
  {
    avatarUrl: '',
    course: false,
    livreurId: 'l1',
    nomComplet: 'Kouamé Yannick Kouadio',
    position: { latitude: 5.3364, longitude: -4.0267 },
    telephone: '0700000000',
    type: 'TURBO',
  },
  {
    avatarUrl: '',
    course: true,
    livreurId: 'l2',
    nomComplet: 'Moubarak Ojebola',
    position: { latitude: 5.3421, longitude: -4.0189 },
    telephone: '0700000001',
    type: 'FREE',
  },
];

const QUARTIERS: QuartierZone[] = [
  {
    actif: true,
    centreLat: 5.3364,
    centreLon: -4.0267,
    id: 'q1',
    libelle: 'AGHA ZONE 4',
    rayonM: 800,
  },
];

export default function ApercuCarteTrafic() {
  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-semibold">Banc de la carte du trafic</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Le composant monté seul, comme le fait l&apos;écran. Sert à vérifier qu&apos;il se
        charge — le retrait des paquets Leaflet ne devait pas le toucher.
      </p>
      <div className="h-[420px] w-full overflow-hidden rounded-lg border border-default-200">
        <MapTrafic positions={POSITIONS} quartiers={QUARTIERS} />
      </div>
    </div>
  );
}
