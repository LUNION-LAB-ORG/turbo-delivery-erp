'use client';

import { PaginatedResponse } from '@/types';
import { DeliveryMan } from '@/types/models';

import { ListeValidationCoursiers } from '../_composants/liste-validation-coursiers';
import useContentCtx from './useContentCtx';

export default function Content({
  initialData,
}: {
  initialData: null | PaginatedResponse<DeliveryMan>;
}) {
  const ctrl = useContentCtx({ initialData });
  return (
    <ListeValidationCoursiers
      ctrl={ctrl}
      titre="Livreurs partiellement validés"
      vide="Aucun livreur partiellement validé"
    />
  );
}
