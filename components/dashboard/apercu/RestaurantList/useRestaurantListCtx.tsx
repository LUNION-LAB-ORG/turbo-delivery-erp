'use client';

import { ChiffreAffaireRestaurant } from '@/types/statistiques.model';
import { useCallback } from 'react';

export const columns = [
    { name: 'Restaurant', uid: 'restaurant' },
    { name: 'Total Commande Terminée', uid: 'commandeTotalTermine' },
    { name: 'Total Commande en Attente', uid: 'commandeTotalEnAttente' },
    { name: 'Total Frais Livraison Terminée', uid: 'fraisLivraisonTotalTermine' },
    { name: 'Total Frais Livraison en Attente', uid: 'fraisLivraisonTotalEnAttente' },
];

export default function useRestaurantListCtx() {
    const renderCell = useCallback((chiffreAffaireRestaurant: ChiffreAffaireRestaurant, columnKey: keyof ChiffreAffaireRestaurant) => {
        const cellValue = chiffreAffaireRestaurant[columnKey];
        switch (columnKey) {
            case 'commandeTotalTermine':
                return <p>{String(cellValue) + ' FCFA'}</p>;
            case 'commandeTotalEnAttente':
                return <p>{String(cellValue) + ' FCFA'}</p>;
            case 'fraisLivraisonTotalTermine':
                return <p>{String(cellValue) + ' FCFA'}</p>;
            case 'fraisLivraisonTotalEnAttente':
                return <p>{String(cellValue) + ' FCFA'}</p>;
            default:
                return cellValue;
        }
    }, []);

    return {
        renderCell,
        columns,
    };
}
