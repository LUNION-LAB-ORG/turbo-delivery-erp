'use client';

import { ArrowDown, ArrowUp, Minus, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ITendanceRang } from '@/features/classement-partenaires/types/classement.types';

/**
 * Le mouvement d'un partenaire par rapport au mois precedent, a cote de son rang.
 *
 * <h3>Pourquoi une fleche ET un chiffre</h3>
 * <p>La couleur seule ne dit rien a qui ne la percoit pas, et rien du tout a l'impression.
 * Elle ne fait ici que RENFORCER deux signes qui suffisent chacun : la fleche donne le
 * sens, le chiffre donne l'ampleur. « +2 » et « -1 » sont deja mis en forme par le
 * serveur, on ne les recalcule pas.</p>
 *
 * <p>La teinte est legitime parce qu'elle dit quelque chose : monter dans un classement
 * est une bonne nouvelle, en descendre une mauvaise. Ce n'est pas la couleur d'une
 * categorie.</p>
 *
 * <h3>Les deux absences, qui ne se confondent pas</h3>
 * <ul>
 *   <li>`NOUVEAU` : le partenaire n'etait pas classe le mois dernier. Il n'a pas chute,
 *       il apparait. On l'ecrit, sans fleche ;</li>
 *   <li>`tendance` a nul : aucune tendance n'est CALCULABLE, faute d'instantane
 *       precedent. La cellule ne montre rien du tout, et le bandeau du haut dit pourquoi
 *       une seule fois plutot que soixante-neuf.</li>
 * </ul>
 */
export function IndicateurTendance({ tendance }: { tendance: ITendanceRang | null }) {
  if (!tendance) return null;

  if (tendance.sens === 'NOUVEAU') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium text-muted"
        title="Ce partenaire n'était pas classé le mois précédent."
      >
        <Sparkles aria-hidden="true" className="size-3" />
        nouveau
      </span>
    );
  }

  const stable = tendance.sens === 'STABLE';
  const hausse = tendance.sens === 'HAUSSE';
  const Fleche = stable ? Minus : hausse ? ArrowUp : ArrowDown;

  /*
   * Deux nuances par teinte, une par theme : mesure faite ailleurs dans ce projet
   * (`components/commons/ecart.tsx`), `green-800` tient le contraste en clair et le perd
   * en sombre, `green-400` fait l'inverse.
   */
  const ton = stable
    ? 'text-muted'
    : hausse
      ? 'text-green-800 dark:text-green-400'
      : 'text-red-800 dark:text-red-400';

  const description = stable
    ? 'Même rang que le mois précédent'
    : `${hausse ? 'Gagne' : 'Perd'} ${Math.abs(tendance.ecart ?? 0)} place${Math.abs(tendance.ecart ?? 0) > 1 ? 's' : ''} (était ${tendance.rangPrecedent}e)`;

  return (
    <span
      className={cn('inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums', ton)}
      title={description}
    >
      <Fleche aria-hidden="true" className="size-3 shrink-0" />
      <span aria-hidden="true">{tendance.libelle ?? ''}</span>
      {/* Le texte lu a voix haute dit le mouvement en toutes lettres : « +2 » seul est
          ambigu hors du contexte de la colonne. */}
      <span className="sr-only">{description}</span>
    </span>
  );
}
