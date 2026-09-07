'use client';

import { Avatar } from '@heroui-v3/react';
import React from 'react';

import { LienBouton } from '@/components/commons/LienBouton';
import { OngletsDeRoute } from '@/components/commons/OngletsDeRoute';
import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { RestaurantDefini } from '@/types/price-list';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

const ONGLETS = [
  { exact: true, href: '/price-list', libelle: 'Restaurants définis' },
  { href: '/price-list/restaurants-undefined', libelle: 'Restaurants indéfinis' },
] as const;

const COMMISSION_LISIBLE: Record<string, string> = {
  FIXE: 'Montant fixe (XOF)',
  POURCENTAGE: 'Pourcentage',
};

/**
 * Les partenaires dont la grille de frais de livraison n'est pas encore définie.
 *
 * <h3>Ce qui change</h3>
 * <p>L'écran existait en DEUX copies — `restaurants-undefined/` et
 * `restaurants-undefined pagination/`, cette seconde ayant un espace dans son nom de
 * dossier, donc une URL que personne ne tape. Toutes deux étaient des routes réelles,
 * avec leur `page.tsx`, leur `Content.tsx` et leur contrôleur. Elles partagent enfin le
 * même écran.</p>
 *
 * <p>Le lien d'action était peint à la main en `bg-red-500 text-white ... rounded-xl` :
 * du rouge de palette brute, sur chaque ligne, pour un geste qui consiste à aller
 * renseigner un tarif. Son libellé disait « Definie type restaurent ».</p>
 *
 * <p>Le type de commission se terminait par un POINT-VIRGULE affiché à l'écran : le `;`
 * qui suivait le ternaire était à l'intérieur du JSX, donc rendu comme du texte. Et les
 * valeurs s'affichaient brutes — « POURCENTAGE % », « (XOF) », « Non definie ».</p>
 *
 * <p>Une LOUPE était posée dans l'en-tête de la colonne des noms, qui n'est pas un champ
 * de recherche.</p>
 */
export function ListeRestaurantsIndefinis({
  avecCommission,
  enChargement,
  onPage,
  page,
  restaurants,
  totalPages,
}: {
  /** La liste paginée affiche aussi le type de commission déjà retenu. */
  avecCommission?: boolean;
  enChargement?: boolean;
  onPage?: (p: number) => void;
  page?: number;
  restaurants: readonly RestaurantDefini[];
  totalPages?: number;
}) {
  const colonnes: ColonneResponsive<RestaurantDefini>[] = [
    {
      cle: 'nomEtablissement',
      identite: true,
      libelle: 'Restaurant',
      rendu: (r) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 shrink-0">
            {r.logo_Url && (
              <Avatar.Image
                alt={r.nomEtablissement}
                src={createUrlFile(r.logo_Url, 'restaurant')}
              />
            )}
            <Avatar.Fallback>{getInitials(r.nomEtablissement || '?')}</Avatar.Fallback>
          </Avatar>
          <span className="truncate text-sm font-medium text-foreground">
            {r.nomEtablissement}
          </span>
        </div>
      ),
    },
    ...(avecCommission
      ? [
          {
            cle: 'typeCommission',
            libelle: 'Type de commission',
            rendu: (r: RestaurantDefini) => (
              <span className="text-sm text-muted">
                {COMMISSION_LISIBLE[r.typeCommission ?? ''] ?? 'Non définie'}
              </span>
            ),
          },
        ]
      : []),
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (r) => (
        <LienBouton href={`/restaurants/${r.id}`} taille="sm" variante="outline">
          Définir les frais
        </LienBouton>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <OngletsDeRoute onglets={ONGLETS} />

      <TableauResponsive
        cleLigne={(r) => String(r.id)}
        colonnes={colonnes}
        enChargement={enChargement}
        libelle="Restaurants indéfinis"
        lignes={restaurants}
        vide="Tous les restaurants ont leurs frais de livraison définis"
      />

      {onPage && page != null && (totalPages ?? 0) > 1 && (
        <div className="flex justify-center">
          <PaginationTableau onPage={onPage} page={page} total={totalPages ?? 1} />
        </div>
      )}
    </div>
  );
}
