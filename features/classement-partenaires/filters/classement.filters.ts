import { parseAsArrayOf, parseAsString, parseAsStringLiteral } from 'nuqs';

import { performanceFiltersClient } from '@/features/rapports-performance/filters/performance.filters';
import { SENS_TRI_DEFAUT, TRI_DEFAUT } from '@/features/classement-partenaires/utils/classement-tri.utils';
import { TRIS_CLASSEMENT } from '@/features/classement-partenaires/types/classement.types';

/**
 * Les filtres URL du classement.
 *
 * <h3>Pourquoi la periode est IMPORTEE et non redeclaree</h3>
 * <p>La note exige que le classement « reste filtre par la meme plage de dates que
 * selectionnee en amont ». Cette garantie doit etre STRUCTURELLE : deux declarations
 * separees de `debut` et `fin` partagent la meme cle URL le jour ou on les ecrit, puis
 * derivent des qu'une des deux change de defaut ou se voit poser un `urlKeys`. Le lien
 * continuerait de fonctionner tout en atterrissant sur une autre periode, sans que rien
 * ne le signale. On reprend donc les parseurs du rapport de performance tels quels.</p>
 *
 * <h3>Les trois parametres de selection</h3>
 * <p>`restaurantId` vient lui aussi du rapport. `restaurantIds` et `groupeId` sont
 * declares ici avec les noms EXACTS des parametres du serveur : le selecteur multiple du
 * rapport est en cours d'ecriture par ailleurs, et ces cles sont le seul point ou les deux
 * ecrans doivent s'accorder. Le classement ne les ECRIT jamais, il les relit et les
 * transmet : c'est l'amont qui choisit le perimetre.</p>
 */
export const classementFiltersClient = {
  filters: {
    debut: performanceFiltersClient.filters.debut,
    fin: performanceFiltersClient.filters.fin,
    restaurantId: performanceFiltersClient.filters.restaurantId,
    restaurantIds: parseAsArrayOf(parseAsString).withDefault([]),
    groupeId: parseAsString.withDefault(''),
    tri: parseAsStringLiteral(TRIS_CLASSEMENT).withDefault(TRI_DEFAUT),
    sens: parseAsStringLiteral(['ASC', 'DESC'] as const).withDefault(SENS_TRI_DEFAUT),
  },
  options: {
    ...performanceFiltersClient.options,
    /*
     * Le tri repart au serveur : sans `clearOnDefault`, l'URL se remplirait de
     * `tri=LIVRAISONS&sens=DESC` des le premier clic de retour au defaut, et le lien
     * partage cesserait de ressembler a celui qu'on vient d'ouvrir.
     */
    clearOnDefault: true,
  },
};
