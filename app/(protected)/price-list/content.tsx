'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import EtatErreur from '@/components/commons/EtatErreur';
import { DeliveryFee } from '@/types/price-list';
import { Card, Table } from '@heroui-v3/react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { OngletsDeRoute } from '@/components/commons/OngletsDeRoute';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import usePriceListTable from '@/features/price-list/hooks/use-price-list-table';
import { priceListColumns, usePriceListRenderCell } from '@/components/dashboard/price-liste/price-list-columns';
import PriceListFormModal from '@/components/dashboard/price-liste/price-list-form-modal';

/*
 * Les onglets etaient un `Tabs` de la v2 dont chaque `Tab` recevait `as={Link}` : un
 * composant d'onglets detourne en barre de navigation. Ils passent par le composant
 * partage, qui rend de vrais liens et porte `aria-current`.
 */
const ONGLETS = [
  { exact: true, href: '/price-list', libelle: 'Restaurants définis' },
  { href: '/price-list/restaurants-undefined', libelle: 'Restaurants indéfinis' },
] as const;

const SKELETON_COUNT = 8;
const skeletonRows = Array.from({ length: SKELETON_COUNT }, (_, i) => ({ id: String(i) }) as DeliveryFee);

export default function Content() {
  const {
    selectedKey,
    tabs,
    deliveryFees,
    handleChangeSelectedKey,
    currentRestaurant,
    editModal,
    openEditModal,
    closeEditModal,
    isLoading,
    isFetching,
    isError,
    refetch,
    pagination,
  } = usePriceListTable();

  const renderCell = usePriceListRenderCell({ currentRestaurant, onEdit: openEditModal });

  const restaurantOptions = tabs
    .map((tab) => ({ value: tab.id, label: tab.nomComplet }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <OngletsDeRoute onglets={ONGLETS} />

      <div className="mt-4 flex flex-col">
        <Card>
          <Card.Content>
            {/*
             * C'etait le second `react-select` du projet, avec sa hauteur imposee en
             * pixels dans un objet `styles` — la seule liste de l'ERP qui ne suivait ni le
             * theme ni la taille des autres champs.
             */}
            <div className="w-full max-w-sm">
              <ChampListe
                label="Restaurant"
                onChange={(v) => handleChangeSelectedKey(v || null)}
                options={restaurantOptions.map((o) => ({ label: o.label, value: o.value }))}
                placeholder="Rechercher un restaurant"
                valeur={selectedKey ?? ''}
              />
            </div>
          </Card.Content>
        </Card>

        {/* En echec, on remplace les DEUX rendus (tableau et cartes) : laisser
            l'un des deux afficher "Aucun frais de livraison" ferait lire une
            grille vide la ou la grille existe et n'a pas pu etre lue. */}
        {isError ? (
          <EtatErreur
            quoi="les frais de livraison"
            onReessayer={() => refetch()}
            enCours={isFetching}
          />
        ) : (
          <>
        {/* Tableau (desktop ≥ md) */}
        <div className="hidden md:block">
          <Table
            className={`mt-4 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
          >
            <Table.ScrollContainer>
              <Table.Content aria-label="Frais de livraison">
                <Table.Header>
                  {priceListColumns.map((column, i) => (
                    <Table.Column
                      className={column.uid === 'actions' ? 'text-center' : undefined}
                      id={column.uid}
                      isRowHeader={i === 0}
                      key={column.uid}
                    >
                      {/* Une LOUPE etait posee dans l'en-tete de la premiere colonne, qui
                          n'est pas un champ de recherche : le symbole promettait une
                          fonction que la colonne n'a pas. */}
                      {column.name}
                    </Table.Column>
                  ))}
                </Table.Header>
                <Table.Body
                  renderEmptyState={() =>
                    isLoading ? null : <EmptyDataTable title="Aucun frais de livraison" />
                  }
                >
                  {(isLoading && !!selectedKey ? skeletonRows : deliveryFees).map((item) =>
                    isLoading && !!selectedKey ? (
                      <Table.Row id={item.id} key={item.id}>
                        {priceListColumns.map((col) => (
                          <Table.Cell key={col.uid}>
                            <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                          </Table.Cell>
                        ))}
                      </Table.Row>
                    ) : (
                      <Table.Row
                        className={(item.actif ?? true) ? undefined : 'opacity-50'}
                        id={item.id}
                        key={item.id}
                      >
                        {priceListColumns.map((column) => (
                          <Table.Cell key={column.uid}>{renderCell(item, column.uid)}</Table.Cell>
                        ))}
                      </Table.Row>
                    ),
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
            {!isLoading && pagination.totalPages > 1 && (
              <Table.Footer>
                <PaginationTableau
                  onPage={pagination.onPageChange}
                  page={pagination.currentPage}
                  total={pagination.totalPages}
                />
              </Table.Footer>
            )}
          </Table>
        </div>

        {/* Cartes (mobile < md) — mêmes données et mêmes actions (renderCell) que le tableau */}
        <div className="md:hidden mt-4 space-y-3">
          {isLoading && !!selectedKey ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`sk-card-${i}`} className="h-32 rounded-xl bg-surface-secondary animate-pulse" />
            ))
          ) : deliveryFees.length === 0 ? (
            <EmptyDataTable title="Aucun frais de livraison" />
          ) : (
            deliveryFees.map((fee) => (
              <div
                key={fee.id}
                className={`bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2 ${(fee.actif ?? true) ? '' : 'opacity-50'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{fee.name || fee.zone}</p>
                    {fee.name && <p className="text-xs text-muted truncate">{fee.zone}</p>}
                  </div>
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {renderCell(fee, 'actions')}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted shrink-0">Distance</span>
                  <span className="text-sm text-foreground text-right">{renderCell(fee, 'distance')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted shrink-0">Coût de livraison</span>
                  <span className="text-sm font-semibold text-foreground text-right">{renderCell(fee, 'prix')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted shrink-0">Commission</span>
                  <span className="text-sm text-foreground text-right">{renderCell(fee, 'commission')}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted shrink-0">Active</span>
                  <span className="text-right" onClick={(e) => e.stopPropagation()}>{renderCell(fee, 'actif')}</span>
                </div>
              </div>
            ))
          )}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <PaginationTableau
                onPage={pagination.onPageChange}
                page={pagination.currentPage}
                total={pagination.totalPages}
              />
            </div>
          )}
        </div>
          </>
        )}
      </div>

      <PriceListFormModal
        mode="edit"
        open={editModal.open}
        onClose={closeEditModal}
        initialData={editModal.selectedFee}
      />
    </>
  );
}
