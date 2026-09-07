'use client';

import React from 'react';

import { TicketTermineReportingDialog } from '@/components/ticket-terminers/reporting-dialog';
import type { Restaurant } from '@/types/models';

/** La fenêtre ne s'ouvre que depuis la liste des bons terminés : on la monte seule. */
export default function ApercuExportBons() {
  const restaurant = { id: 'apercu', nomEtablissement: 'Chez Yamoussa' } as Restaurant;

  return (
    <TicketTermineReportingDialog
      initialiType="LIVRAISON"
      isOpen
      onClose={() => undefined}
      restaurant={restaurant}
      type="POURCENTAGE"
    />
  );
}
