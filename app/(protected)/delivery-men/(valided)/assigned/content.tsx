'use client';

import { Button } from '@heroui-v3/react';
import { Pencil, X } from 'lucide-react';
import React from 'react';

import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { SearchField } from '@/components/commons/form/search-field';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { SelectField } from '@/components/commons/select-field';
import {
  ColonneResponsive,
  TableauResponsive,
} from '@/components/commons/TableauResponsive';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant } from '@/types/models';

import { CelluleCoursier } from '../../_composants/cellule-coursier';
import { UpdateDeliveryDialog } from '../../update-delivery/update-delivery';
import { useTurboAssigneController } from './useTurboAssigneController';

interface Props {
  initialData: PaginatedResponse<LivreurStatutVM> | null;
  restaurants: Restaurant[] | null;
}

/**
 * Les coursiers affectés à un site partenaire.
 *
 * <h3>Ce qui change</h3>
 * <p>Les deux gestes de la ligne — modifier, retirer — étaient des `&lt;span onClick&gt;`
 * portant `text-white p-1 bg-surface-tertiary`. Trois défauts d'un coup : du texte BLANC
 * sur une surface CLAIRE, donc une icône invisible en thème clair ; un `&lt;span&gt;`, donc
 * rien que le clavier atteigne et rien que le lecteur d'écran annonce ; et aucun nom
 * accessible sur ce qui RETIRE un livreur de la flotte.</p>
 *
 * <p>Le bouton « Confirmé » n'avait AUCUN gestionnaire : un bouton pleinement actif,
 * dessiné comme le geste principal de la ligne, sur lequel il ne se passait rien. Ce
 * n'était pas une action mais un état — le livreur EST confirmé — et il se lit
 * maintenant comme tel.</p>
 *
 * <p>« Enregistrer » était peint en `destructive` : enregistrer une affectation n'a jamais
 * détruit quoi que ce soit.</p>
 *
 * <p>La pagination était `fixed bottom-4`, posée par-dessus le contenu avec un flou en
 * arrière-plan, et la phrase « Affichage de X à Y » vivait ailleurs dans la page, sous une
 * barre qui la recouvrait. Elle calculait ses bornes avec un pas de 5 écrit en dur, alors
 * que le contrôleur décide de la taille de page : dès que celle-ci change, le décompte
 * ment.</p>
 */
export default function Content({ initialData, restaurants }: Props) {
  const ctrl = useTurboAssigneController(initialData, restaurants);
  const rows = ctrl.data?.content ?? [];
  const total = ctrl.data?.totalElements ?? 0;
  const premier = rows.length === 0 ? 0 : (ctrl.currentPage - 1) * ctrl.pageSize + 1;
  const dernier = Math.min(ctrl.currentPage * ctrl.pageSize, total);

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
      cle: 'restaurant',
      libelle: 'Affectation',
      rendu: (l) => (
        <div onClick={() => ctrl.setLivreur(l)}>
          <SelectField
            label="nomEtablissement"
            livreur={l}
            options={restaurants || []}
            selectValue={l.restaurantLibelle}
            setLivreur={ctrl.setLivreur}
            setSelectValue={ctrl.setRestaurantSelected}
          />
        </div>
      ),
    },
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (l) => {
        const modifiable =
          ctrl.livreur?.livreurId &&
          ctrl.restaurantSelected !== l.restaurantLibelle &&
          ctrl.livreur?.livreurId === l.livreurId;

        return (
          <div className="flex flex-wrap items-center gap-2">
            {modifiable && (
              <Button
                onPress={() => ctrl.changerRestaurantLivreurs(l)}
                size="sm"
                variant="primary"
              >
                Enregistrer l&apos;affectation
              </Button>
            )}

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
              onPress={() => ctrl.supprimerLivreur(l)}
              size="sm"
              variant="danger-soft"
            >
              <X aria-hidden="true" className="size-4" />
            </Button>

            {ctrl.updateLivreurId === l.livreurId && (
              <Button onPress={() => ctrl.onConfirmStatut(l, 'FREE')} size="sm" variant="outline">
                Désassigner (passer en bird)
              </Button>
            )}
          </div>
        );
      },
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
        libelle="Coursiers assignés"
        lignes={rows}
        onReessayer={ctrl.reessayer}
        quoi="les livreurs assignés"
        vide="Aucun livreur assigné"
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

      {/* Le decompte suit la taille de page DU CONTROLEUR, plus un 5 ecrit en dur. */}
      <p className="text-center text-sm text-muted">
        Affichage de {premier} à {dernier} sur {total} résultat{total > 1 ? 's' : ''}
        {ctrl.searchKey && ` (filtré de ${ctrl.initialData?.totalElements ?? 0} au total)`}
      </p>

      <UpdateDeliveryDialog
        isOpen={ctrl.isOpen}
        livreur={ctrl.livreur}
        onClose={ctrl.onClose}
        restaurants={restaurants}
        typeLiveur="TURBO"
      />
      <ConfirmDialog {...ctrl.confirm} />
    </div>
  );
}
