'use client';

import { Button } from '@heroui-v3/react';
import { Check, X } from 'lucide-react';
import React from 'react';

import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { SearchField } from '@/components/commons/form/search-field';
import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import ValidateDialog from '@/components/commons/validate-dialog';
import { DemandeAssignationVM, Restaurant } from '@/types/models';

import { CelluleCoursier } from '../../_composants/cellule-coursier';
import { useDemandeAssignationController } from './useDemandeAssignationController';

/**
 * Les demandes d'identification déposées par les coursiers.
 *
 * <h3>Ce qui change</h3>
 * <p>Le bouton « Accorder » — celui des demandes de passage en bird — était peint en
 * `bg-orange-500`, une couleur de la palette Tailwind brute qui n'appartient à aucune
 * palette de l'ERP et n'a pas de variante sombre. Le bouton « Accepter » juste à côté,
 * lui, portait la couleur par défaut. Deux gestes de même nature, deux apparences, et une
 * seule des deux lisible en thème sombre.</p>
 *
 * <p>Le rejet était un `&lt;span onClick&gt;` en `text-white` sur une surface claire :
 * invisible en thème clair, inatteignable au clavier, sans nom accessible. Son état
 * désactivé était obtenu par `pointer-events-none` — ce qui le retire de la souris mais le
 * laisse dans l'ordre de tabulation, où il ne fait rien.</p>
 *
 * <p>L'écran n'avait AUCUN état d'échec : la liste vient d'un chargement serveur, et une
 * lecture ratée rendait un tableau vide, donc « Aucune demande » — la phrase exacte d'une
 * file réellement traitée. L'opérateur en concluait qu'il n'avait rien à faire.</p>
 */
export default function Content({
  allRestaurant,
  demandeAssignations,
}: {
  allRestaurant: Restaurant[];
  demandeAssignations: DemandeAssignationVM[];
}) {
  const ctrl = useDemandeAssignationController(demandeAssignations);
  const rows = ctrl.data ?? [];

  const colonnes: ColonneResponsive<DemandeAssignationVM>[] = [
    {
      cle: 'nom',
      identite: true,
      libelle: 'Nom complet',
      rendu: (d) => <CelluleCoursier avatarUrl={d.avatarUrl} nom={d.nomComplet ?? ''} />,
    },
    {
      cle: 'statut',
      libelle: 'Statut',
      rendu: (d) => ctrl.recupererStatut(d.statutDemandeAssignation),
    },
    {
      cle: 'date',
      libelle: 'Date',
      rendu: (d) => <span className="tabular-nums">{d.date ?? '-'}</span>,
    },
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (d) => {
        const rejetee = d.statutDemandeAssignation === 'REJETER';
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onPress={() => (d.type === 'FREE' ? ctrl.accortder(d) : ctrl.onOpenDialog(d))}
              size="sm"
              variant="primary"
            >
              <Check aria-hidden="true" className="size-4" />
              {d.type === 'FREE' ? 'Accorder' : 'Accepter'}
            </Button>

            <Button
              aria-label={`Rejeter la demande de ${d.nomComplet ?? 'ce livreur'}`}
              isDisabled={rejetee}
              isIconOnly
              onPress={() => ctrl.retirer(d.id ?? '')}
              size="sm"
              variant="danger-soft"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-6 pt-0">
      <SearchField onChange={ctrl.setSelectValue} searchKey={ctrl.selectValue} />

      <TableauResponsive
        cleLigne={(d) => d.id ?? ''}
        colonnes={colonnes}
        libelle="Demandes d'identification"
        lignes={rows}
        vide="Aucune demande en attente"
      />

      <ValidateDialog
        demandeAssignationId={ctrl.demandeAssignationId}
        isOpen={ctrl.isOpen}
        nomComplet={ctrl.nomComplet}
        onClose={ctrl.onCloseDialog}
        rejeter={ctrl.rejeter}
        restaurants={allRestaurant}
        setRestaurantId={ctrl.setRestaurantSelectId}
        valider={ctrl.valider}
      />
      <ConfirmDialog {...ctrl.confirm} />
    </div>
  );
}
