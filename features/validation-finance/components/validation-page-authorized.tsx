'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Spinner } from '@heroui-v3/react';
import { useValidationData, useHistoryData } from '../hooks/use-validation-data';
import { getPendingCount, useValidationStats } from '../hooks/use-validation-stats';
import { useValidationActions } from '../hooks/use-validation-actions';
import { IChargeVariable } from '@/features/charges/types/charge-variable.type';
import AddDepenseVariableModal from '@/features/charges/components/add-depense-variable-modal';
import {
  ChargeType,
  Role,
  ROLE_CONFIG,
  SubTab,
} from './validation.constants';
import { ValidationHeader } from './validation-header';
import { ChargeTypeSwitcher } from './charge-type-switcher';
import { TabSwitcher } from './tab-switcher';
import { ValidationCard } from './validation-card';
import { ValidationStats } from './validation-stats';
import { HistoryList } from './history-list';
import EtatErreur from '@/components/commons/EtatErreur';

export function ValidationPageAuthorized({ userRole }: { userRole: Role }) {
  const [chargeType, setChargeType] = useState<ChargeType>('variable');
  const [activeTab, setActiveTab] = useState<SubTab>('validation');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [chargeVariableToEdit, setChargeVariableToEdit] = useState<IChargeVariable | null>(null);

  const { depenses, rawVariables, isLoading, isFetching, isError, refetch, totalFile } = useValidationData(chargeType, userRole);
  const {
    depenses: historyDepenses,
    isLoading: isLoadingHistory,
    isFetching: isFetchingHistory,
    isError: isErrorHistory,
    refetch: refetchHistory,
  } = useHistoryData(userRole, activeTab === 'historique');
  const {
    stats,
    isLoading: isLoadingStats,
    isFetching: isFetchingStats,
    isError: isErrorStats,
    refetch: refetchStats,
  } = useValidationStats(userRole, chargeType);
  const { handleAccept, handleReject, isPending } = useValidationActions(userRole, chargeType);

  const safeIdx = Math.min(currentIdx, Math.max(0, depenses.length - 1));
  const pendingCount = getPendingCount(stats, userRole);

  const handleChargeTypeChange = (type: ChargeType) => {
    setChargeType(type);
    setCurrentIdx(0);
  };

  const handleOpenEdit = () => {
    if (chargeType !== 'variable' || !rawVariables) return;
    const currentId = depenses[safeIdx]?.id;
    if (!currentId) return;
    const raw = rawVariables.find((v) => v.id === currentId);
    if (raw) setChargeVariableToEdit(raw);
  };

  return (
    <div className="bg-surface-secondary">
      <ValidationHeader role={userRole} pendingCount={pendingCount} />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <ChargeTypeSwitcher chargeType={chargeType} onChange={handleChargeTypeChange} />

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <>
            {isErrorStats ? (
              <div className="rounded-xl border border-separator bg-surface">
                <EtatErreur
                  quoi="les compteurs de validation"
                  onReessayer={() => refetchStats()}
                  enCours={isFetchingStats}
                />
              </div>
            ) : (
              !isLoadingStats && <ValidationStats role={userRole} stats={stats} />
            )}
            <TabSwitcher tab={activeTab} onChange={setActiveTab} pendingCount={pendingCount} />

            {activeTab === 'validation' ? (
              /* Sur echec, la file de validation tombait sur « Aucune depense a valider » :
                 le valideur en concluait qu'il n'avait rien a traiter. */
              isError ? (
                <div className="rounded-b-xl border border-t-0 border-separator bg-surface">
                  <EtatErreur
                    quoi="les dépenses à valider"
                    onReessayer={() => refetch()}
                    enCours={isFetching}
                  />
                </div>
              ) : depenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-b-xl border border-t-0 border-separator bg-surface py-16 text-muted">
                  <CheckCircle2 className="mb-2 h-10 w-10" />
                  <p className="text-sm">Aucune dépense à valider</p>
                </div>
              ) : (
                <ValidationCard
                  depense={depenses[safeIdx]}
                  current={safeIdx}
                  total={depenses.length}
                  totalFile={totalFile}
                  onPrev={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  onNext={() => setCurrentIdx((i) => Math.min(depenses.length - 1, i + 1))}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onEdit={chargeType === 'variable' ? handleOpenEdit : undefined}
                  acceptLabel={ROLE_CONFIG[userRole].acceptLabel}
                  canAct={depenses.length > 0}
                  isDGA={userRole === 'dga'}
                  isPending={isPending}
                />
              )
            ) : (
              isLoadingHistory ? (
                <div className="flex justify-center rounded-b-xl border border-t-0 border-separator bg-surface py-16">
                  <Spinner />
                </div>
              ) : isErrorHistory ? (
                <div className="rounded-b-xl border border-t-0 border-separator bg-surface">
                  <EtatErreur
                    quoi="l'historique des validations"
                    onReessayer={() => refetchHistory()}
                    enCours={isFetchingHistory}
                  />
                </div>
              ) : (
                <HistoryList depenses={historyDepenses} />
              )
            )}
          </>
        )}
      </main>

      <AddDepenseVariableModal
        isOpen={!!chargeVariableToEdit}
        onClose={() => setChargeVariableToEdit(null)}
        chargeToEdit={chargeVariableToEdit}
      />
    </div>
  );
}

