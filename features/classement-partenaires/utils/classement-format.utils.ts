import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { IPeriodeClassement } from '@/features/classement-partenaires/types/classement.types';
import { formatMontant, formatNombre } from '@/utils/format.utils';

/**
 * Le glyphe d'ABSENCE. C'est la convention du depot, et elle porte un sens precis : « on
 * ne sait pas », ou « cela ne s'applique pas ». Jamais « zero ».
 */
export const ABSENT = '—';

/**
 * Un effectif, ou un montant.
 *
 * <p>Les deux DELEGUENT a `utils/format.utils`, qui porte le suffixe monetaire unique du
 * projet et l'espace INSECABLE qui le precede. Reecrire le formatage ici aurait pose un
 * second « FCFA » dans un depot qui vient tout juste d'en unifier deux, et la meme colonne
 * aurait fini par afficher les deux formes.</p>
 *
 * <p>Une valeur absente rend le glyphe d'absence, jamais « 0 » ni « NaN ».</p>
 */
export function nombre(n: number | null | undefined): string {
  return formatNombre(n);
}

/** Un montant en FCFA, arrondi a l'unite : le franc CFA n'a pas de subdivision. */
export function montant(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return ABSENT;
  return formatMontant(Math.round(n));
}

/**
 * Un taux de succes.
 *
 * <p>`null` rend un tiret et NON « 0 % ». Le serveur met ce champ a nul quand aucune
 * course du partenaire n'a ete conclue sur la periode : ecrire « 0 % » affirmerait que
 * toutes ont echoue, ce qui est l'inverse de « il ne s'est rien passe ». Dix-huit des
 * soixante-neuf lignes d'avril 2026 sont dans ce cas.</p>
 */
export function taux(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return ABSENT;
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

/** Un ecart en pourcentage, signe. `null` quand la reference valait zero : voir les VM. */
export function pourcentageSigne(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return ABSENT;
  const signe = n > 0 ? '+' : '';
  return `${signe}${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
}

/** Un ecart en valeur, signe, pour que « +690 » et « -690 » ne se confondent pas. */
export function valeurSignee(
  n: number | null | undefined,
  formateur: (v: number) => string = nombre,
): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return ABSENT;
  return `${n > 0 ? '+' : ''}${formateur(n)}`;
}

/** `2026-04` en « avril 2026 ». Rend la cle telle quelle si elle n'est pas lisible. */
export function libelleMois(mois: string | null | undefined): string {
  if (!mois) return ABSENT;
  const date = parse(mois, 'yyyy-MM', new Date());
  if (Number.isNaN(date.getTime())) return mois;
  return format(date, 'MMMM yyyy', { locale: fr });
}

/**
 * La periode, en une ligne.
 *
 * <p>Un mois calendaire complet s'ecrit « avril 2026 » et non « 01/04/2026 au 30/04/2026 » :
 * c'est la meme information, et la premiere forme dit en plus que la periode est un mois,
 * donc qu'elle peut porter un instantane.</p>
 */
export function libellePeriode(periode: IPeriodeClassement | undefined): string {
  if (!periode) return ABSENT;
  if (periode.mois) return libelleMois(periode.mois);
  return `du ${jourCourt(periode.debut)} au ${jourCourt(periode.fin)}`;
}

/** `2026-04-30` en « 30/04/2026 ». */
export function jourCourt(iso: string | null | undefined): string {
  if (!iso) return ABSENT;
  const date = parse(iso, 'yyyy-MM-dd', new Date());
  if (Number.isNaN(date.getTime())) return iso;
  return format(date, 'dd/MM/yyyy');
}

/** Un instant ISO en « 10/09/2026 à 17:26 ». */
export function instant(iso: string | null | undefined): string {
  if (!iso) return ABSENT;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return format(date, "dd/MM/yyyy 'à' HH:mm");
}

/** Le mois calendaire d'une date, au format que le serveur attend. */
export function cleMois(date: Date): string {
  return format(date, 'yyyy-MM');
}

/** Le rang, ecrit comme on le dit : 1er, 2e, 3e. */
export function libelleRang(rang: number): string {
  return rang === 1 ? '1er' : `${rang}e`;
}
