import { Chip, type ChipProps, Table } from '@heroui-v3/react';

import type { ICreneauDetailLivreur, StatutLivreurDetail } from '../types/historique-creneaux.type';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

/**
 * Les trois etats d'un livreur dans le lot, rendus par `Chip`.
 *
 * <p>Les pastilles etaient des `span` habilles a la main en `bg-green-100 text-green-700`
 * et `bg-red-100 text-red-600`, sans variante sombre. Depuis que la bascule de theme est
 * dans l'en-tete, le comptable qui travaillait en sombre lisait du vert pastel sur fond
 * sombre : le statut devenait illisible sur la colonne meme qui dit si la ligne part en
 * paiement ou non.</p>
 *
 * <p>Ici, contrairement au statut de ticket qui compte SIX crans, l'echelle semantique de
 * la v3 suffit exactement : succes, danger, neutre. Aucune couleur n'a donc a etre ecrite
 * a la main, et les deux themes sont couverts par le composant.</p>
 */
const STATUT_CHIP: Record<StatutLivreurDetail, { label: string; couleur: ChipProps['color'] }> = {
  OK:      { label: 'OK',      couleur: 'success' },
  REJETE:  { label: 'Rejeté',  couleur: 'danger' },
  ATTENTE: { label: 'Attente', couleur: 'default' },
};

interface Props {
  livreurs: ICreneauDetailLivreur[];
  /**
   * Totaux SERVEUR (`grille.stats`), pas des sommes recalculees sur `livreurs`.
   *
   * <p>La requete est plafonnee a 100 lignes et cet ecran ne pagine pas. Recompter sur
   * le tableau recu donnait donc « 100 livreurs » dans cet en-tete, a quelques pixels
   * d'une carte KPI qui affichait, elle, le vrai total serveur — deux chiffres
   * contradictoires sur le meme ecran, le second fige a 100 des que le creneau
   * depassait 100 livreurs. Le creneau etant HEBDOMADAIRE et le parc comptant environ
   * 190 livreurs, le depassement est le cas normal, pas l'exception.</p>
   */
  totalLivreurs: number;
  totalTickets: number;
}

export default function HistoriqueCreneauDetailLivreurs({ livreurs, totalLivreurs, totalTickets }: Props) {
  // Les lignes 101 et suivantes ne sont pas rendues et rien ne le signalait. On le dit,
  // sur la formulation deja employee par orientation-fonds-view.tsx.
  const tronque = livreurs.length < totalLivreurs;

  return (
    <div className="rounded-xl border border-separator bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-separator">
        <h2 className="text-sm font-semibold text-foreground">Détail livreurs</h2>
        <p className="text-xs text-muted mt-0.5">
          {totalLivreurs} livreurs · {totalTickets} tickets
          {tronque && (
            <span className="ml-2 text-muted">{livreurs.length} affichés</span>
          )}
        </p>
      </div>

      {/* Tableau — desktop uniquement (≥ md) */}
      <Table className="hidden md:block">
        <Table.ScrollContainer>
          <Table.Content aria-label="Détail livreurs">
            <Table.Header>
              <Table.Column id="turboy" isRowHeader>
                Turboy
              </Table.Column>
              {/*
                Quatre colonnes de chiffres qui se comparent d'une ligne a l'autre : elles
                s'alignent a droite en chasse tabulaire, sinon « 1 250 » et « 980 » ne se
                lisent qu'en comptant les caracteres.
              */}
              <Table.Column className="text-right" id="tickets">
                Tickets
              </Table.Column>
              <Table.Column className="text-right" id="brut">
                Brut
              </Table.Column>
              <Table.Column className="text-right" id="taux">
                Taux
              </Table.Column>
              <Table.Column className="text-right" id="net">
                Net
              </Table.Column>
              <Table.Column id="statut">Statut</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <p className="py-8 text-center text-sm text-muted">Aucun livreur</p>
              )}
            >
              {livreurs.map((l) => {
                const chip = STATUT_CHIP[l.statut];
                return (
                  <Table.Row id={l.id} key={l.id}>
                    <Table.Cell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{l.nom}</span>
                        <span className="text-[11px] text-muted">{l.code}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <span className="text-sm tabular-nums text-foreground">{l.tickets}</span>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <span className="text-sm tabular-nums text-foreground">{fmt(l.brut)}</span>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <span className="text-sm tabular-nums text-foreground">{l.taux}%</span>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {fmt(l.net)}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Chip color={chip.couleur} size="sm" variant="soft">
                        <Chip.Label>{chip.label}</Chip.Label>
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {/* Mobile — cartes tactiles (remplace le tableau < md) */}
      <div className="md:hidden space-y-3 p-4">
        {livreurs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aucun livreur</p>
        ) : (
          livreurs.map((l) => {
            const chip = STATUT_CHIP[l.statut];
            return (
              <div key={l.id} className="bg-surface border border-separator rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{l.nom}</p>
                    <p className="text-[11px] text-muted">{l.code}</p>
                  </div>
                  <Chip className="shrink-0" color={chip.couleur} size="sm" variant="soft">
                    {chip.label}
                  </Chip>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Tickets</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{l.tickets}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Brut</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{fmt(l.brut)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Taux</span>
                  <span className="text-right text-sm tabular-nums text-foreground">{l.taux}%</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-muted">Net</span>
                  <span className="text-right text-sm font-semibold tabular-nums text-success-soft-foreground">{fmt(l.net)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
