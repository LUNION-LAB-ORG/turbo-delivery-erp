import { format } from 'date-fns';

import { apiClientHttp } from '@/lib/api-client-http';
import type {
  IClassement,
  IComparaisonClassement,
  IEvolutionPartenaire,
  IParamsClassement,
  IRapportSnapshot,
  SensTri,
  TriClassement,
} from '@/features/classement-partenaires/types/classement.types';

const RACINE = '/api/erp/analytics/classement';

/**
 * La date en `aaaa-MM-jj` LOCAL.
 *
 * <p>Et non `toISOString().split('T')[0]`, qui convertit d'abord en UTC : une borne posee
 * a minuit sur un poste a l'est de Greenwich repart alors sur la veille, et le classement
 * du 1er du mois se calcule sur une periode qui commence le 31. Le serveur est a Abidjan,
 * ou l'ecart est nul aujourd'hui ; il ne le sera pas depuis un autre poste.</p>
 */
const jour = (d: Date) => format(d, 'yyyy-MM-dd');

/**
 * Les trois parametres de selection, tels que le serveur les nomme.
 *
 * <p>La precedence `groupeId > restaurantIds > restaurantId` est appliquee PAR LE SERVEUR,
 * qui rend son arbitrage dans `selection.parametresIgnores`. On n'arbitre donc rien ici :
 * un ecran qui filtrerait de son cote afficherait « groupe X » sur des chiffres agreges
 * autrement, et personne ne le verrait.</p>
 */
function perimetre(params: {
  restaurantId?: string;
  restaurantIds?: string[];
  groupeId?: string;
}): Record<string, string | undefined> {
  return {
    groupeId: params.groupeId || undefined,
    restaurantIds:
      params.restaurantIds && params.restaurantIds.length ? params.restaurantIds.join(',') : undefined,
    restaurantId: params.restaurantId || undefined,
  };
}

export const classementAPI = {
  /**
   * Le classement d'une periode.
   *
   * <p>La periode part TOUJOURS en `debut`/`fin`, jamais en `mois`, parce que la note
   * impose de conserver la plage choisie en amont et qu'elle peut ne pas etre un mois. Le
   * serveur reconnait de lui-meme un mois calendaire complet : il rend alors
   * `periode.mois`, `granularite: MENSUEL` et `instantaneAbsent`, ce qui suffit a l'ecran
   * pour proposer le rattrapage.</p>
   */
  obtenirClassement(params: IParamsClassement): Promise<IClassement> {
    return apiClientHttp.request<IClassement>({
      endpoint: RACINE,
      method: 'GET',
      params: {
        debut: jour(params.debut),
        fin: jour(params.fin),
        sens: params.sens,
        tri: params.tri,
        ...perimetre(params),
      },
    });
  },

  /** La fiche d'un partenaire : douze derniers mois CLOS par defaut, bornee a 36. */
  obtenirEvolution(params: {
    restaurantId: string;
    depuis?: string;
    jusqua?: string;
    sens: SensTri;
    tri: TriClassement;
  }): Promise<IEvolutionPartenaire> {
    return apiClientHttp.request<IEvolutionPartenaire>({
      endpoint: `${RACINE}/evolution`,
      method: 'GET',
      params: {
        depuis: params.depuis || undefined,
        jusqua: params.jusqua || undefined,
        restaurantId: params.restaurantId,
        sens: params.sens,
        tri: params.tri,
      },
    });
  },

  /**
   * Deux periodes cote a cote. `A` est la REFERENCE, la plus ancienne ; les ecarts vont
   * de A vers B. L'ordre des arguments n'est pas cosmetique : intervertir les deux mois
   * change le signe de chaque ecart.
   */
  obtenirComparaison(params: {
    moisA: string;
    moisB: string;
    sens: SensTri;
    tri: TriClassement;
    restaurantId?: string;
    restaurantIds?: string[];
    groupeId?: string;
  }): Promise<IComparaisonClassement> {
    return apiClientHttp.request<IComparaisonClassement>({
      endpoint: `${RACINE}/comparaison`,
      method: 'GET',
      params: {
        moisA: params.moisA,
        moisB: params.moisB,
        sens: params.sens,
        tri: params.tri,
        ...perimetre(params),
      },
    });
  },

  /**
   * La capture manuelle d'un instantane. SEULE ecriture de cet ecran.
   *
   * <p>Le serveur exige un `X-User-Id` sur cette route et sur elle seule : l'en-tete est
   * pose par l'intercepteur de `api-client-http`, il n'y a rien a passer ici. `ecraser`
   * n'est pas expose : reecrire un historique dont l'interet est de ne pas bouger n'est
   * pas un geste d'ecran.</p>
   */
  capturerInstantane(mois: string): Promise<IRapportSnapshot> {
    return apiClientHttp.request<IRapportSnapshot>({
      endpoint: `${RACINE}/snapshot`,
      method: 'POST',
      params: { mois },
    });
  },
};
