'use client';

import React from 'react';

import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import { formatMontant } from '@/utils/format.utils';

/**
 * Le détail d'une journée : une ligne par course.
 *
 * <h3>Ce qui change</h3>
 * <p>Le fichier portait en tête un objet `gainsDataa` de cent-vingt lignes — trois
 * journées de courses fictives, avec leurs codes « A123 », « B456 », « C789 » et des
 * montants de 5, 3 et 4 francs — qui n'était utilisé nulle part. Des données d'essai
 * oubliées, et un nom à trois « a ».</p>
 *
 * <p>Les en-têtes disaient « coute de livraison » et « commussion », l'état vide « Aucun
 * livreur » sur un tableau de COURSES, et le tableau s'annonçait aux lecteurs d'écran
 * sous le nom « Example table with custom cells ».</p>
 *
 * <p>Chaque ligne était cliquable et posait `setOpen(true)` — mais rien ne lisait `open` :
 * la fenêtre était importée sans jamais être rendue.</p>
 */
const COLONNES: ColonneResponsive<GainDetail>[] = [
  {
    cle: 'date',
    identite: true,
    libelle: 'Date',
    rendu: (g) => (
      <span className="text-sm tabular-nums text-foreground">{g.date || 'Non définie'}</span>
    ),
  },
  {
    cle: 'tickets',
    libelle: 'Ticket',
    rendu: (g) => <span className="text-sm text-foreground">{g.code}</span>,
  },
  {
    cle: 'frais',
    libelle: 'Coût de livraison',
    nombre: true,
    rendu: (g) => <span className="text-sm text-foreground">{formatMontant(g.frais)}</span>,
  },
  {
    cle: 'commission',
    libelle: 'Commission',
    nombre: true,
    rendu: (g) => <span className="text-sm text-foreground">{formatMontant(g.commission)}</span>,
  },
];

export default function TableCreneauDetail({
  initialData,
}: {
  initialData: [] | GainDetail[];
}) {
  return (
    <TableauResponsive
      cleLigne={(g) => String(g.code ?? '')}
      colonnes={COLONNES}
      libelle="Détail des courses du jour"
      lignes={initialData ?? []}
      vide="Aucune course sur ce jour"
    />
  );
}
