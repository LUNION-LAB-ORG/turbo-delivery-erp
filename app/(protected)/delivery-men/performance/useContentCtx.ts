'use client';

import { useState } from 'react';
import { PaginatedResponse } from '@/types';

interface props {
    initialData: PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null;
}

export default function useContentCtx({ initialData }: props) {
    const [data, setData] = useState<LivreurPerformanceBirdEndTorubo[]>(initialData?.content || []);


    /*
     * SUPPRIME : un useEffect qui calculait `currentWeekItems` et ne s'en servait pas.
     * Trente lignes de code mort, dont la derniere lisait `item.creneau.debut` SANS
     * GARDE - un livreur sans emploi du temps y aurait leve une TypeError et vide
     * l'ecran, pour un resultat que personne ne lisait.
     *
     * Le regroupement par semaine se fait dans UserListPerformanceBird, sur les bornes
     * que le serveur envoie, et non sur une semaine recalculee ici a partir de
     * `new Date()`.
     */


    return { data };
}
