import { IDepense } from '@/features/depenses/types/depense.type';

import { HistoryRow } from './history-row';

interface HistoryListProps {
  depenses: IDepense[];
}

/**
 * L'historique des depenses tranchees.
 *
 * <h3>Ce qui change</h3>
 * <p>Le titre « Historique de toutes les depenses » repetait l'onglet et portait une icone
 * peinte au rouge d'alerte de la palette, sur un en-tete qui n'alerte de rien. L'icone
 * est retiree, et le titre ne garde que ce que l'onglet ne dit pas : cette liste ignore la
 * bascule variable/fixe et rend les deux.</p>
 *
 * <p>La liste defile a l'interieur du panneau, comme la file de validation : l'ecran
 * entier ne bouge plus sous les compteurs.</p>
 */
export function HistoryList({ depenses }: HistoryListProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-large border border-separator bg-surface">
      <div className="flex shrink-0 items-baseline justify-between gap-3 border-b border-separator px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Toutes les dépenses, variables et fixes</h2>
        <p className="shrink-0 text-xs tabular-nums text-muted">{depenses.length}</p>
      </div>

      {depenses.length === 0 ? (
        <p className="flex min-h-0 flex-1 items-center justify-center p-8 text-center text-sm text-muted">Aucune dépense enregistrée</p>
      ) : (
        <div className="min-h-0 flex-1 divide-y divide-separator overflow-y-auto">
          {depenses.map((depense) => (
            <HistoryRow depense={depense} key={depense.id} />
          ))}
        </div>
      )}
    </section>
  );
}
