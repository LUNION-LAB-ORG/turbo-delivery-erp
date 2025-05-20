'use client';

import { useEffect, useState } from 'react';
import { PaginatedResponse } from '@/types';
import { useSearchParams } from 'next/navigation';

interface props {
  initialData: PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null;
}


export default function useContentCtx({ initialData }: props) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState<string | null>(null);
  const textParam = searchParams.get('text');
  const [data, setData] = useState<LivreurPerformanceBirdEndTorubo[]>(initialData?.content||[]);


  //filtrage
  useEffect(() => {
    // Initialiser search à partir de textParam
    setSearch(textParam);

    // Si search n'est pas vide, filtrer les données
    if (search !== null && search.trim() !== '') {
      const filtered = initialData?.content.filter((item) => item.nomComplet.toLowerCase().includes(search.toLowerCase())) || [];
      setData(filtered);
    } else {
      // Si search est vide, restaurer la liste initiale
      setData(initialData?.content || []);
    }
  }, [search, textParam, initialData?.content]);


  return {
    data,
    
  };
}
