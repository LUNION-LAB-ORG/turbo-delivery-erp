import { useMemo } from 'react';
import { useChargesVariablesQuery } from '@/features/charges/queries/charges-variables.query';
import { useChargesFixesQuery } from '@/features/charges/queries/charges-fixes.query';
import { useHistoriqueChargesQuery } from '@/features/charges/queries/historique-charge.query';
import { IDepense } from '@/features/depenses/types/depense.type';
import {
  ChargeType,
  Role,
  ROLE_TO_BACKEND,
  chargeFixeToDepense,
  chargeVariableToDepense,
  historiqueChargeToDepense,
} from '../components/validation.constants';

export function useValidationData(chargeType: ChargeType, role: Role) {
  const backendRole = ROLE_TO_BACKEND[role];
  const variablesQuery = useChargesVariablesQuery({ page: 0, size: 100, role: backendRole }, chargeType === 'variable');
  const fixesQuery = useChargesFixesQuery({ page: 0, size: 100, role: backendRole }, chargeType === 'fixe');

  const depenses = useMemo<IDepense[]>(() => {
    if (chargeType === 'variable') {
      return (variablesQuery.data?.content ?? []).map(chargeVariableToDepense);
    }
    return (fixesQuery.data?.content ?? []).map(chargeFixeToDepense);
  }, [chargeType, variablesQuery.data, fixesQuery.data]);

  const rawVariables = chargeType === 'variable' ? variablesQuery.data?.content : undefined;

  const isLoading = chargeType === 'variable' ? variablesQuery.isLoading : fixesQuery.isLoading;
  // L'ecran bascule entre charges variables et fixes : on suit l'echec et la relance
  // de la query REELLEMENT active, sinon on afficherait l'erreur de l'onglet inactif.
  const isFetching = chargeType === 'variable' ? variablesQuery.isFetching : fixesQuery.isFetching;
  const isError = chargeType === 'variable' ? variablesQuery.isError : fixesQuery.isError;
  const refetch = chargeType === 'variable' ? variablesQuery.refetch : fixesQuery.refetch;

  /**
   * Total SERVEUR de la file, distinct du nombre de lignes chargees.
   *
   * <p>La requete est plafonnee a 100 (page 0) et l'ecran ne pagine pas : la carte
   * annoncait « Depense N sur {depenses.length} », donc « sur 100 » des que la file
   * depassait le plafond. Le valideur traitait ses 100 dossiers, voyait la file se vider,
   * et concluait qu'il avait fini, alors que le compteur d'attente voisin, lui, vient
   * des stats serveur et affichait un autre chiffre.</p>
   */
  const totalFile =
    (chargeType === 'variable' ? variablesQuery.data?.totalElements : fixesQuery.data?.totalElements) ?? 0;

  return { depenses, rawVariables, totalFile, isLoading, isFetching, isError, refetch };
}

export function useHistoryData(role: Role, enabled: boolean) {
  const backendRole = ROLE_TO_BACKEND[role] as 'DGA' | 'DG' | 'COMPTABLE';
  const historiqueQuery = useHistoriqueChargesQuery(
    { page: 0, size: 20, role: backendRole },
    enabled,
  );

  const depenses = useMemo<IDepense[]>(() => {
    return (historiqueQuery.data?.content ?? []).map(historiqueChargeToDepense);
  }, [historiqueQuery.data?.content]);

  return {
    depenses,
    isLoading: historiqueQuery.isLoading,
    isFetching: historiqueQuery.isFetching,
    isError: historiqueQuery.isError,
    refetch: historiqueQuery.refetch,
  };
}

