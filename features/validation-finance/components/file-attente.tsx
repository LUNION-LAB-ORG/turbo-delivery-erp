'use client';

import { IDepense } from '@/features/depenses/types/depense.type';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

import { fmtDate } from './validation.constants';

interface FileAttenteProps {
  depenses: IDepense[];
  /** Index du dossier ouvert dans le panneau voisin. */
  index: number;
  onSelect: (index: number) => void;
  /** Total SERVEUR de la file, quand il depasse les lignes chargees. */
  totalFile?: number;
}

/**
 * La file d'attente du valideur.
 *
 * <p>Elle n'existait pas. L'ecran ne montrait qu'un dossier a la fois, avec deux fleches
 * et « Depense 1 sur 12 » : pour savoir ce qui l'attendait, le valideur devait cliquer
 * douze fois. Il ne pouvait ni commencer par les gros montants, ni verifier qu'un dossier
 * urgent etait bien dans la pile, ni revenir en arriere autrement qu'en reculant pas a
 * pas. Une file d'attente se lit en LISTE, c'est sa forme naturelle, et c'est aussi ce
 * qui remplit les deux tiers d'ecran laisses vides a droite du dossier.</p>
 *
 * <p>Les montants sont cales a droite, en chasse tabulaire : d'une ligne a l'autre ils
 * tombent sur la meme colonne, donc ils se comparent.</p>
 */
export function FileAttente({ depenses, index, onSelect, totalFile }: FileAttenteProps) {
  const enPlus = typeof totalFile === 'number' && totalFile > depenses.length;

  // Sur telephone la mise en page s'empile : sans plafond, il faudrait faire defiler toute
  // la file avant d'atteindre le dossier. Sur poste (md et au-dela) la hauteur vient du
  // parent, qui la MESURE.
  return (
    <aside className="flex max-h-[45vh] w-full shrink-0 flex-col overflow-hidden rounded-large border border-separator bg-surface md:max-h-none md:w-64">
      <div className="flex items-baseline justify-between gap-2 border-b border-separator px-3 py-2.5">
        <h2 className="text-sm font-semibold text-foreground">File d&apos;attente</h2>
        <p className="shrink-0 text-xs tabular-nums text-muted">{enPlus ? `${depenses.length} sur ${totalFile}` : depenses.length}</p>
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {depenses.map((depense, i) => (
          <li key={depense.id}>
            <button
              aria-current={i === index ? 'true' : undefined}
              className={cn(
                'w-full rounded-medium px-2.5 py-2 text-left transition-colors',
                'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent',
                i === index ? 'bg-surface-secondary ring-1 ring-accent' : 'hover:bg-surface-secondary',
              )}
              onClick={() => onSelect(i)}
              type="button"
            >
              <span className="block truncate text-sm font-medium text-foreground">{depense.libelle}</span>
              <span className="mt-0.5 flex items-baseline justify-between gap-2">
                <span className="truncate text-xs tabular-nums text-muted">{fmtDate(depense.dateDepense)}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">{formatMontant(depense.montant)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
