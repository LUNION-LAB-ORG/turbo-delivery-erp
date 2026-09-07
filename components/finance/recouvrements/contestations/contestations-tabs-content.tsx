'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ComboBox, Input, Label, ListBox, Spinner } from '@heroui-v3/react';

import { PaginationTableau } from '../common/pagination-tableau';
import useContestationsDashboard from '@/features/recouvrements/hooks/use-contestations-dashboard';
import { useContestationsQuery } from '@/features/recouvrements/queries/contestation.query';
import { RestaurantSelect } from '../common/restaurant-select';
import DateFilterInput from '@/components/finance/date-filter-input';
import { IContestation } from '@/features/recouvrements/types';
import { ContestationCard } from './contestation-card';
import EtatErreur from '@/components/commons/EtatErreur';

interface ContestationsTabsContentProps {
  restoOpts: Array<{ value: string; label: string }>;
  isOptionsLoading?: boolean;
}

export function ContestationsTabsContent({ restoOpts, isOptionsLoading }: ContestationsTabsContentProps) {
  const { filters, handleDateChange, handleRestaurantChange, handleStatusChange } = useContestationsDashboard();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  /*
   * Reinitialiser la page quand les filtres changent.
   *
   * <p>Les bornes de periode sont des objets `Date` : nuqs en rend une NOUVELLE instance
   * a chaque rendu. Deposees telles quelles en dependance, elles se comparent par
   * reference et l'effet repart a chaque fois — la page revenait a 1 aussitot demandee,
   * la pagination etait inutilisable. On compare leur VALEUR.</p>
   */
  const debutMs = filters.debut instanceof Date ? filters.debut.getTime() : filters.debut;
  const finMs = filters.fin instanceof Date ? filters.fin.getTime() : filters.fin;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.restaurantId, debutMs, finMs, filters.status]);

  const { data: contestationsData, isLoading, isError, isFetching, refetch } = useContestationsQuery(
    {
      factureId: filters.restaurantId || '',
      debut: filters.debut?.toISOString().split('T')[0],
      fin: filters.fin?.toISOString().split('T')[0],
      page: currentPage - 1,
      size: pageSize,
    },
  );

  // Filtrer les contestations par statut si sélectionné
  const filteredContestations = React.useMemo(() => {
    if (!contestationsData?.content || !filters.status) {
      return contestationsData?.content || [];
    }
    return contestationsData.content.filter((c) => c.statut === filters.status);
  }, [contestationsData, filters.status]);

  const totalPages = contestationsData?.totalPages || 1;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-4 pb-4">
        <h2 className="text-lg font-medium">Contestations</h2>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 w-full flex-wrap">
          <RestaurantSelect
            value={filters.restaurantId}
            onChange={handleRestaurantChange}
            options={restoOpts}
            isLoading={isOptionsLoading}
            placeholder="Sélectionner un restaurant"
            className="w-full sm:w-[280px]"
          />

          <DateFilterInput
            filters={{
              debut: filters.debut,
              fin: filters.fin,
            }}
            handleDateChange={handleDateChange}
            variant="secondary"
          />

          {/*
           * Un `ComboBox` et non un `Select`, comme partout ailleurs — et surtout, le
           * `Select` de la v2 recevait un `onChange` DOM alors qu'il rend
           * `onSelectionChange` : le filtre de statut ne changeait rien.
           */}
          <ComboBox
            className="w-full max-w-xs"
            onSelectionChange={(c) => handleStatusChange(c === 'TOUS' ? '' : String(c ?? ''))}
            selectedKey={filters.status || 'TOUS'}
          >
            <Label>Statut</Label>
            <ComboBox.InputGroup>
              <Input />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox
                items={[
                  { cle: 'TOUS', libelle: 'Tous les statuts' },
                  { cle: 'ACTIVE', libelle: 'Active' },
                  { cle: 'RESOLUE', libelle: 'Résolue' },
                ]}
              >
                {(o: { cle: string; libelle: string }) => (
                  <ListBox.Item id={o.cle} textValue={o.libelle}>
                    {o.libelle}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </ListBox>
            </ComboBox.Popover>
          </ComboBox>
        </div>
      </CardHeader>

      <CardContent className="w-full">
        {filters.restaurantId && isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Spinner />
            <p className="text-sm text-muted">Chargement des contestations…</p>
          </div>
        )}

        {/* sur echec, l'erreur prend la place de "Aucune contestation trouvee" qui se lirait comme un vrai vide */}
        {filters.restaurantId && !isLoading && isError && (
          <EtatErreur quoi="les contestations" onReessayer={() => refetch()} enCours={isFetching} />
        )}

        {!isLoading && !isError && filteredContestations.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {filteredContestations.map((contestation: IContestation) => (
                <ContestationCard
                  key={contestation.id}
                  contestation={contestation}
                  onResolve={() => refetch()}
                />
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-4">
                <PaginationTableau onPage={handlePageChange} page={currentPage} total={totalPages} />
              </div>
            )}
          </>
        )}

        {filters.restaurantId && !isLoading && !isError && filteredContestations.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p>Aucune contestation trouvée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}




