'use client';
import { use } from "react";
import EtatErreur from '@/components/commons/EtatErreur';

import { notFound } from 'next/navigation';
import { Skeleton } from '@heroui-v3/react';
import FactureDetailView from '@/components/finance/responsable-financier/facture-detail-view';
import { useFactureRFQuery } from '@/features/responsable-financier';

interface Props {
  params: Promise<{ id: string }>;
}

export default function FactureDetailPage(props: Props) {
  const params = use(props.params);
  const { data: facture, isLoading, isError, isFetching, refetch } = useFactureRFQuery(params.id);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-40 rounded" />
        <Skeleton className="h-10 w-64 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  /*
   * `isError || !facture` confondait DEUX choses opposees : la facture n'existe pas, et
   * la facture n'a pas pu etre lue. Sur un 500, un delai depasse ou une coupure reseau,
   * l'ecran annoncait « cette page n'existe pas » — l'operateur en concluait que la
   * facture avait ete supprimee, et cessait de la chercher.
   */
  if (isError) {
    return (
      <EtatErreur
        quoi="la facture"
        onReessayer={() => refetch()}
        enCours={isFetching}
      />
    );
  }

  if (!facture) notFound();

  return <FactureDetailView facture={facture} />;
}
