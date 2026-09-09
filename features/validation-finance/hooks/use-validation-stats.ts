import { format, subDays } from 'date-fns';
import { ChargeType, Role, ROLE_TO_BACKEND } from '../components/validation.constants';
import { useValidationStatsQuery } from '../queries/validation-stats.query';

interface IChargeTypeStats {
  comptable: { total: number; aDecaisser: number; decaisse: number };
  dga: { enAttente: number; montant: number };
  dg: { enAttente: number; approuvees: number; montant: number };
}

export function getPendingCount(stats: IChargeTypeStats, role: Role): number {
  if (role === 'comptable') return stats.comptable.aDecaisser;
  if (role === 'dga') return stats.dga.enAttente;
  return stats.dg.enAttente;
}

const EMPTY_STATS: IChargeTypeStats = {
  comptable: { total: 0, aDecaisser: 0, decaisse: 0 },
  dga: { enAttente: 0, montant: 0 },
  dg: { enAttente: 0, approuvees: 0, montant: 0 },
};

export function useValidationStats(role: Role, chargeType: ChargeType, debut?: string, fin?: string) {
  const now = new Date();
  const defaultFin = format(now, 'yyyy-MM-dd');
  const defaultDebut = format(subDays(now, 30), 'yyyy-MM-dd');

  const { data, isLoading, isFetching, isError, refetch } = useValidationStatsQuery({
    role: ROLE_TO_BACKEND[role],
    debut: debut ?? defaultDebut,
    fin: fin ?? defaultFin,
  });

  const stats: IChargeTypeStats = data
    ? chargeType === 'fixe' ? data.fixes : data.variables
    : EMPTY_STATS;

  // La reponse porte les DEUX types de charge. L'onglet ferme peut donc dire ce qu'il
  // retient sans seconde lecture. `null` tant que rien n'est su : un onglet qui annonce
  // « 0 » sur une lecture qui a echoue affirme une file vide, ce qui est pire que se taire.
  const attentes = data
    ? {
        variable: getPendingCount(data.variables, role),
        fixe: getPendingCount(data.fixes, role),
      }
    : null;

  // Sans data on retombe sur EMPTY_STATS, qui affiche « 0 en attente » : indiscernable
  // d'une file de validation vraiment vide. On remonte l'echec a l'ecran.
  return { stats, attentes, isLoading, isFetching, isError, refetch };
}
