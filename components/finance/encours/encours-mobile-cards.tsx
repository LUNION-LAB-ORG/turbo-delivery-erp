'use client';

import { Card, Chip } from '@heroui-v3/react';

import { cycleLabel, formatFcfa, formatNombre, IEncoursReleve } from '@/features/encours';
import { formatPeriodeFacturee, formatPeriodeFactureeEncours } from '@/lib/finance/periode-facturee';

import { estAVenir, sommeAcomptes } from './encours-derive';

const STATUT_COLOR: Record<string, 'danger' | 'default' | 'success' | 'warning'> = {
  'En cours': 'default',
  'En retard': 'danger',
  Partiel: 'warning',
  Payé: 'success',
};

/**
 * Le releve au doigt, sur telephone.
 *
 * <p>Le cycle portait une couleur - `secondary` en quinzaine, `primary` en hebdomadaire -
 * alors que c'est une etiquette de periodicite, pas un etat. Sur ce releve la couleur dit
 * le statut de paiement, et rien d'autre.</p>
 *
 * <p>Deux ecarts avec la vue poste de travail sont corriges : la periode etait
 * reconstruite depuis (annee, mois, cycle) meme quand la facture portait ses bornes
 * reelles, ce qui affichait le mois entier pour une facture du 1er au 7 aout ; et le
 * total a payer n'apparaissait pas, si bien que l'acompte se lisait sans son ordre de
 * grandeur. Les periodes « A venir » sont annoncees a part, comme sur le poste : ce sont
 * des periodes non encore facturees, elles n'ont ni montant ni solde.</p>
 *
 * <p>Elles sont annoncees sous LEUR point de vente, et non sous le partenaire : c'est le
 * seul endroit ou l'operateur lit quel etablissement n'est pas encore facture. Un point
 * de vente dont toutes les periodes sont a venir n'etait plus rendu du tout - aucun
 * montant n'etait perdu, il n'y en a pas, mais son existence l'etait.</p>
 */
export function EncoursMobileCards({ releve }: { releve: IEncoursReleve }) {
  if (!releve.partenaires?.length) {
    return (
      <Card>
        <Card.Content className="items-center py-10 text-center">
          <p className="text-sm text-muted">Aucun reste à payer pour cette sélection.</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {releve.partenaires.map((p, pi) => (
        <Card key={`${p.groupe}-${pi}`}>
          <Card.Content className="gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-semibold text-foreground">{p.groupe}</span>
                {/* Le cycle est une etiquette de periodicite, pas un etat : en puce, il
                    avait la meme forme que le statut de paiement, qui lui est un etat. */}
                <span className="shrink-0 text-[11px] text-muted">{cycleLabel(p.cycle)}</span>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                {formatFcfa(p.sousTotalReste)}
              </span>
            </div>

            {p.stores.map((s, si) => {
              const factures = (s.factures ?? []).filter((f) => !estAVenir(f));
              const aVenirDuStore = (s.factures ?? []).filter(estAVenir);
              const pluriel = aVenirDuStore.length > 1 ? 's' : '';

              return (
                <div key={`${s.store}-${si}`}>
                  {/*
                   * Le RESTE du point de vente, sur la meme ligne que son nom.
                   *
                   * C'est le seul chiffre operatoire d'un ecran nomme « Restes a payer »,
                   * et il avait disparu au profit de « facture … · acompte … ». Les deux
                   * autres montants ne sont pas perdus pour autant : ils passent sur la
                   * ligne du dessous. A 390 px, les trois sur une seule ligne rognaient le
                   * nom du point de vente jusqu'a « Coc… ».
                   */}
                  <div className="flex items-baseline justify-between gap-2 text-xs font-medium">
                    <span className="min-w-0 truncate text-muted">{s.store}</span>
                    {factures.length > 0 ? (
                      <span className="shrink-0 font-semibold tabular-nums text-foreground">
                        reste {formatFcfa(s.reste)}
                      </span>
                    ) : null}
                  </div>
                  {factures.length > 0 ? (
                    <p className="text-[11px] tabular-nums text-muted">
                      facturé {formatFcfa(s.totalFacture)} · acompte{' '}
                      {formatFcfa(sommeAcomptes(factures))}
                    </p>
                  ) : null}
                  {aVenirDuStore.length > 0 && (
                    <p className="mt-1 text-[11px] text-muted">
                      {formatNombre(aVenirDuStore.length)} période{pluriel} à venir, pas encore
                      facturée{pluriel}
                    </p>
                  )}
                  {factures.length > 0 && (
                    <div className="mt-1 divide-y divide-separator rounded-lg border border-separator">
                      {factures.map((f, fi) => (
                        <div
                          className="flex items-center justify-between gap-2 px-2.5 py-2 text-sm"
                          key={`${f.libelle}-${fi}`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {f.periodeDebut
                                ? formatPeriodeFacturee(
                                    f.mode === 'Plage de dates' ? 'HEBDOMADAIRE' : p.cycle,
                                    f.periodeDebut,
                                    f.periodeFin ?? f.periodeDebut,
                                  )
                                : formatPeriodeFactureeEncours(
                                    releve.annee,
                                    f.mois,
                                    p.cycle,
                                    f.libelle,
                                  )}
                            </p>
                            <p className="text-xs tabular-nums text-muted">
                              {formatFcfa(f.totalAPayer)} · payé {formatFcfa(f.acompte)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="font-semibold tabular-nums text-foreground">
                              {formatFcfa(f.solde)}
                            </span>
                            <Chip
                              color={STATUT_COLOR[f.statut] ?? 'default'}
                              size="sm"
                              variant="soft"
                            >
                              <Chip.Label>{f.statut}</Chip.Label>
                            </Chip>
                          </div>
                        </div>
                      ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {Boolean(p.deduction) && (
                <p className="text-right text-xs tabular-nums text-muted">
                  Déduction : - {formatFcfa(p.deduction)}
                </p>
              )}
            </Card.Content>
          </Card>
      ))}

      <Card className="bg-surface-secondary">
        <Card.Content className="flex-row items-center justify-between">
          <span className="font-bold text-foreground">TOTAL GÉNÉRAL</span>
          <span className="text-lg font-bold tabular-nums text-foreground">
            {formatFcfa(releve.totalReste)}
          </span>
        </Card.Content>
      </Card>
    </div>
  );
}
