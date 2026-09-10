import { parseAsArrayOf, parseAsIsoDate, parseAsString, parseAsStringLiteral } from 'nuqs';
import { endOfMonth, startOfMonth } from 'date-fns';

/**
 * Les trois facons de designer la selection du rapport de performance.
 *
 * <p>`GLOBAL` n'en est pas une : c'est ce que le SERVEUR repond quand aucun parametre de
 * selection n'accompagne la periode. On ne le choisit pas, on y retombe - un mode
 * « unitaire » sans partenaire choisi, ou un mode « multi » sans case cochee.</p>
 */
export const MODES_SELECTION = ['UNITAIRE', 'MULTI', 'GROUPE'] as const;

export type ModeSelection = (typeof MODES_SELECTION)[number];

/**
 * Les filtres du rapport, TOUS dans l'URL.
 *
 * <h3>Pourquoi `mode` n'a PAS de valeur par defaut</h3>
 * <p>`restaurantId` circule dans des liens deja partages, qui ne portent evidemment aucun
 * `mode`. Un defaut ecrit ici serait invisible dans l'URL mais bien present dans l'etat :
 * il faudrait alors ecrire `mode=UNITAIRE` a chaque partage pour que le lien reste lisible,
 * et un lien fabrique a la main avec `restaurantIds=a,b` serait silencieusement rendu en
 * unitaire - le contraire de ce que le serveur, lui, en ferait.</p>
 *
 * <p>Le mode est donc DEDUIT quand il n'est pas ecrit, avec exactement la precedence du
 * serveur (`groupeId` > `restaurantIds` > `restaurantId`), dans `usePerformanceFilters`.
 * Consequence voulue : un lien unitaire reste aujourd'hui octet pour octet ce qu'il etait
 * avant ce lot.</p>
 */
export const performanceFiltersClient = {
  filters: {
    debut: parseAsIsoDate.withDefault(startOfMonth(new Date())),
    fin: parseAsIsoDate.withDefault(endOfMonth(new Date())),
    /** Absent de l'URL tant que l'operateur n'a pas quitte le mode unitaire. */
    mode: parseAsStringLiteral(MODES_SELECTION),
    /** ⚠ NE PAS RETIRER : des liens circulent avec ce seul parametre. */
    restaurantId: parseAsString.withDefault(''),
    /**
     * Mode MULTI. `parseAsArrayOf` serialise en `a,b,c`, exactement la forme que
     * l'endpoint attend - la forme repetee marche aussi cote serveur, mais une seule
     * occurrence garde l'URL lisible.
     */
    restaurantIds: parseAsArrayOf(parseAsString).withDefault([]),
    /** Mode GROUPE : l'identifiant du groupe constitue dans l'ERP. */
    groupeId: parseAsString.withDefault(''),
  },
  options: {
    shallow: true,
  },
};
