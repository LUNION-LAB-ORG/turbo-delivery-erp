'use client';

import { Button, Chip } from '@heroui-v3/react';
import { Pencil, X } from 'lucide-react';
import React from 'react';

import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { SearchField } from '@/components/commons/form/search-field';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant } from '@/types/models';

import { CelluleCoursier } from '../../_composants/cellule-coursier';
import { UpdateDeliveryDialog } from '../../update-delivery/update-delivery';
import { useTurboysBirdController } from './useTurboAssigneController';

interface Props {
  initialData: PaginatedResponse<LivreurStatutVM> | null;
  restaurants?: Restaurant[] | null;
}

/**
 * Les coursiers birds : validés, mais rattachés à aucun site partenaire.
 *
 * <h3>Ce qui change</h3>
 * <p>La fonction de rendu des cellules commençait par `=> {7894` — quatre chiffres tombés
 * là au clavier, jamais remarqués parce que c'est une expression JavaScript valide. Ils
 * étaient en production.</p>
 *
 * <p>Comme sur l'écran des assignés, les deux gestes de la ligne étaient des
 * `&lt;span onClick&gt;` en `text-white` sur une surface claire : invisibles en thème
 * clair, inatteignables au clavier, et sans nom pour le lecteur d'écran — sur le bouton
 * qui RETIRE un livreur.</p>
 *
 * <p>Et « Confirmé » était un bouton actif sans gestionnaire. Un livreur bird EST validé :
 * c'est un état, il se lit, on ne clique pas dessus.</p>
 */
export default function Content({ initialData, restaurants }: Props) {
  const ctrl = useTurboysBirdController(initialData);
  const rows = ctrl.data?.content ?? [];

  const colonnes: ColonneResponsive<LivreurStatutVM>[] = [
    {
      cle: 'nom',
      identite: true,
      libelle: 'Nom et prénom',
      rendu: (l) => <CelluleCoursier avatarUrl={l.avatarUrl} nom={l.nomPrenom ?? ''} />,
    },
    {
      cle: 'dateInscription',
      libelle: "Date d'inscription",
      rendu: (l) => <span className="tabular-nums">{l.dateInscription ?? '-'}</span>,
    },
    {
      cle: 'statut',
      libelle: 'Statut',
      rendu: () => (
        <Chip color="success" size="sm" variant="soft">
          <Chip.Label>Confirmé</Chip.Label>
        </Chip>
      ),
    },
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (l) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            aria-label={`Modifier ${l.nomPrenom ?? 'ce livreur'}`}
            isIconOnly
            onPress={() => ctrl.setUpdateLivreurId(l.livreurId ?? '')}
            size="sm"
            variant="ghost"
          >
            <Pencil aria-hidden="true" className="size-4" />
          </Button>

          <Button
            aria-label={`Retirer ${l.nomPrenom ?? 'ce livreur'} de la flotte`}
            isIconOnly
            onPress={() => ctrl.supprimerLivreur(l, 'WAITING')}
            size="sm"
            variant="danger-soft"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>

          {ctrl.updateLivreurId === l.livreurId && (
            <Button onPress={() => ctrl.modifier(l)} size="sm" variant="outline">
              Assigner à un site partenaire
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-6 pt-0">
      <SearchField onChange={ctrl.setSearchKey} searchKey={ctrl.searchKey} />

      <TableauResponsive
        cleLigne={(l) => l.livreurId ?? ''}
        colonnes={colonnes}
        enChargement={ctrl.isLoading && rows.length === 0}
        enCoursDeRelance={ctrl.isLoading}
        erreur={ctrl.isError}
        libelle="Coursiers birds"
        lignes={rows}
        onReessayer={ctrl.reessayer}
        quoi="les livreurs non assignés"
        vide="Aucun livreur bird"
      />

      {(ctrl.data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center">
          <PaginationTableau
            onPage={ctrl.setCurrentPage}
            page={ctrl.currentPage}
            total={ctrl.data?.totalPages ?? 1}
          />
        </div>
      )}

      <UpdateDeliveryDialog
        isOpen={ctrl.isOpen}
        livreur={ctrl.livreur}
        onClose={ctrl.onClose}
        restaurants={restaurants || []}
        typeLiveur="TURBO"
      />
      <ConfirmDialog {...ctrl.confirm} />
    </div>
  );
}
