'use client';

import React from 'react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import { PaginatedResponse } from '@/types';
import { DeliveryMan } from '@/types/models';

interface ControleurListe {
  columns: { name: string; uid: string }[];
  currentPage: number;
  data: null | PaginatedResponse<DeliveryMan>;
  fetchData: (page: number) => void;
  isError: boolean;
  isLoading: boolean;
  reessayer: () => void;
  renderCell: (item: DeliveryMan, cle: string) => React.ReactNode;
}

/**
 * Une file de coursiers à qualifier : les nouveaux, les partiellement validés.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>Les deux écrans étaient le MÊME fichier de quatre-vingt-dix lignes, à deux
 * différences près : le titre, et une ligne de carte tactile supplémentaire. Tout le
 * reste — le tableau, la liste de cartes, la pagination, l'état d'échec — y était recopié
 * à l'identique, si bien qu'une correction sur l'un laissait l'autre en arrière.</p>
 *
 * <h3>Ce qui change</h3>
 * <p>Le tableau s'annonçait aux lecteurs d'écran sous le nom
 * « Example table with custom cells » : la légende de l'exemple de la documentation
 * HeroUI, restée dans les deux écrans jusqu'en production.</p>
 *
 * <p>La pagination était `fixed bottom-4`, collée au bas de la FENÊTRE et posée par-dessus
 * le contenu, avec un rectangle flouté en arrière-plan pour la détacher. Sur la fenêtre
 * réelle des postes (563 px de haut), elle recouvrait les dernières lignes du tableau.
 * Elle s'affichait aussi quand il n'y avait qu'une seule page.</p>
 *
 * <p>Enfin, une fonction `renderCols` enveloppait chaque en-tête de colonne dans un
 * `text-primary` : dix titres de colonnes en ROUGE DE MARQUE, sur deux écrans où rien
 * n'appelle une action.</p>
 */
export function ListeValidationCoursiers({
  ctrl,
  titre,
  vide,
}: {
  ctrl: ControleurListe;
  titre: string;
  vide: string;
}) {
  const rows = ctrl.data?.content ?? [];

  const colonnes: ColonneResponsive<DeliveryMan>[] = ctrl.columns.map((c) => ({
    actions: c.uid === 'actions',
    cle: c.uid,
    identite: c.uid === 'nom',
    libelle: c.name,
    rendu: (l) => ctrl.renderCell(l, c.uid),
  }));

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4 pb-10">
      <h1 className="text-2xl font-bold text-foreground">{titre}</h1>

      <TableauResponsive
        cleLigne={(l) => String(l.id ?? '')}
        colonnes={colonnes}
        enChargement={ctrl.isLoading && rows.length === 0}
        enCoursDeRelance={ctrl.isLoading}
        erreur={ctrl.isError}
        libelle={titre}
        lignes={rows}
        onReessayer={ctrl.reessayer}
        quoi="les livreurs"
        vide={vide}
      />

      {(ctrl.data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center">
          <PaginationTableau
            onPage={ctrl.fetchData}
            page={ctrl.currentPage}
            total={ctrl.data?.totalPages ?? 1}
          />
        </div>
      )}
    </div>
  );
}
