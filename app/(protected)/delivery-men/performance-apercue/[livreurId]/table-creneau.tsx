'use client';

import React from 'react';

import { TableauProgression } from '@/components/dashboard/delivery-men/performance-apercu/tableau-progression';
import { Progression } from '@/types/performance-creneauId';

/**
 * La progression d'un livreur sur son créneau.
 *
 * <h3>Ce qui change</h3>
 * <p>Le fichier portait en tête un objet `dataCreneau` de trente lignes — un identifiant
 * de livreur et trois jours écrits en dur — qui n'était utilisé nulle part : des données
 * d'essai oubliées dans le fichier.</p>
 *
 * <p>Chaque ligne était cliquable et posait `setOpen(true)`, mais rien ne lisait `open` :
 * la fenêtre de détail était importée sans jamais être rendue. Le curseur changeait, le
 * clic ne faisait rien.</p>
 */
export default function TableCreneau({ initialData }: { initialData: Progression[] }) {
  return <TableauProgression jours={initialData ?? []} />;
}
