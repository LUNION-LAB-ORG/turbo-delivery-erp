'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { classementAPI } from '@/features/classement-partenaires/apis/classement.api';
import type {
  IParamsClassement,
  IRapportSnapshot,
  SensTri,
  TriClassement,
} from '@/features/classement-partenaires/types/classement.types';

export const classementKeys = {
  all: ['classement-partenaires'] as const,
  classement: (p: IParamsClassement) =>
    [
      ...classementKeys.all,
      'periode',
      format(p.debut, 'yyyy-MM-dd'),
      format(p.fin, 'yyyy-MM-dd'),
      p.tri,
      p.sens,
      p.groupeId ?? '',
      (p.restaurantIds ?? []).join(','),
      p.restaurantId ?? '',
    ] as const,
  evolution: (restaurantId: string, tri: TriClassement, sens: SensTri) =>
    [...classementKeys.all, 'evolution', restaurantId, tri, sens] as const,
  comparaison: (moisA: string, moisB: string, tri: TriClassement, sens: SensTri) =>
    [...classementKeys.all, 'comparaison', moisA, moisB, tri, sens] as const,
};

/*
 * Les dates sont mises a plat dans la cle plutot que passees en objet : deux `Date`
 * distinctes portant le meme jour ne sont pas egales, et react-query relancerait la
 * requete a chaque rendu qui reconstruit la borne. C'est le piege nuqs deja rencontre
 * ailleurs dans ce projet.
 */

/** Le classement de la periode affichee. */
export const useClassementQuery = (params: IParamsClassement) =>
  useQuery({
    queryKey: classementKeys.classement(params),
    queryFn: () => classementAPI.obtenirClassement(params),
    staleTime: 5 * 60 * 1000,
  });

/**
 * La fiche d'evolution d'un partenaire. `enabled` sur l'identifiant : la fiche s'ouvre a
 * la demande, une liste de soixante-neuf partenaires ne prefetch pas soixante-neuf fiches.
 */
export const useEvolutionPartenaireQuery = (
  restaurantId: string | null,
  tri: TriClassement,
  sens: SensTri,
) =>
  useQuery({
    enabled: Boolean(restaurantId),
    queryFn: () =>
      classementAPI.obtenirEvolution({ restaurantId: restaurantId as string, sens, tri }),
    queryKey: classementKeys.evolution(restaurantId ?? '', tri, sens),
    staleTime: 10 * 60 * 1000,
  });

/** La comparaison de deux mois. Ne part que lorsque les DEUX mois sont choisis. */
export const useComparaisonQuery = (
  moisA: string,
  moisB: string,
  tri: TriClassement,
  sens: SensTri,
) =>
  useQuery({
    enabled: Boolean(moisA && moisB),
    queryFn: () => classementAPI.obtenirComparaison({ moisA, moisB, sens, tri }),
    queryKey: classementKeys.comparaison(moisA, moisB, tri, sens),
    staleTime: 10 * 60 * 1000,
  });

/**
 * La capture d'un instantane.
 *
 * <p>Le serveur repond 200 meme quand il n'a RIEN ecrit : un mois non clos, un instantane
 * deja pris, aucun partenaire. Le succes HTTP ne dit donc pas que la capture a eu lieu, et
 * un `toast.success` inconditionnel annoncerait un historique qui n'existe pas. On lit
 * `statut`, et on n'invalide le cache que lorsque des lignes ont ete ecrites.</p>
 */
export const useCapturerInstantaneMutation = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (mois: string) => classementAPI.capturerInstantane(mois),
    onError: (erreur) =>
      toast.error("L'instantané n'a pas pu être capturé", {
        description: erreur instanceof Error ? erreur.message : 'Erreur inconnue',
      }),
    onSuccess: async (rapport: IRapportSnapshot) => {
      const ecrit = rapport.statut === 'CAPTURE' || rapport.statut === 'REECRIT';

      if (ecrit) {
        await client.invalidateQueries({ queryKey: classementKeys.all });
        toast.success(`Instantané de ${rapport.mois ?? 'la période'} capturé`, {
          description: `${rapport.lignesEcrites ?? 0} partenaire(s) figés. La tendance sera disponible sur le mois suivant.`,
        });
        return;
      }

      toast.warning('Aucun instantané écrit', {
        description: rapport.message ?? `Le serveur a répondu « ${rapport.statut} ».`,
      });
    },
  });
};
