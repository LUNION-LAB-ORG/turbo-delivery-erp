'use client';

import { fetchFilleAttente } from '@/src/actions/file-attente.actions';
import { FilleAttenteHistoriqueVM, FilleAttenteVM } from '@/types/file-attente.model';
import { useEffect, useState } from 'react';

export function useFileAttenteController() {
    const [fileAttenteSelected, setFileAttentSeled] = useState<any>(null)
    const [fileAttentes, setFileAttentes] = useState<FilleAttenteHistoriqueVM[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedData, setSelectedData] = useState<FilleAttenteVM[] | undefined>([])

    const fetchFileAttentes = async () => {
        try {
            setIsLoading(true);
            const result = await fetchFilleAttente();
            setFileAttentes(result);
        } catch (error) {
            console.error('Error fetching file attentes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFileAttentes();
    }, []);

    const onSelectFileAttente = (restaurantId?: string) => {
        const fileAttenteFound = fileAttentes.find((item) => item.restaurantId === restaurantId);
        setSelectedData(fileAttenteFound?.fileAttentes);
        setFileAttentSeled(restaurantId)
    }

    return {
        fileAttentes,
        isLoading,
        refreshData: fetchFileAttentes,
        setFileAttentSeled,
        fileAttenteSelected,
        onSelectFileAttente,
        selectedData
    };
}
