'use client';

import { Card, ComboBox, Input, ListBox, Spinner, Table } from '@heroui-v3/react';
import { ArrowRight } from 'lucide-react';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { cn } from '@/lib/utils';
import {
  COLONNES_COMPARAISON,
  INDICATEURS_COMPARAISON,
} from '@/features/classement-partenaires/components/comparaison-table-columns';
import { useComparaisonClassement } from '@/features/classement-partenaires/hooks/use-comparaison-classement';
import type { SensTri, TriClassement } from '@/features/classement-partenaires/types/classement.types';
import {
  libelleMois,
  pourcentageSigne,
} from '@/features/classement-partenaires/utils/classement-format.utils';
import { LIBELLE_TRI } from '@/features/classement-partenaires/utils/classement-tri.utils';

/**
 * COMPARER DEUX PERIODES.
 *
 * <h3>Ce qu'on regarde en premier</h3>
 * <p>L'ENSEMBLE, pas le detail : est-ce que le mois a ete meilleur, et de combien. Le
 * tableau du haut repond a cela, un indicateur par ligne, les deux periodes cote a cote et
 * l'ecart a droite. Le detail par partenaire, en dessous, repond ensuite a « qui ».</p>
 *
 * <h3>Le choix des mois est une RECHERCHE</h3>
 * <p>Vingt-quatre entrees : ce sont des `ComboBox` et non des listes deroulantes nues,
 * comme partout ailleurs dans ce projet des qu'une liste se cherche.</p>
 *
 * <p>Cet ecran fonctionne SANS instantane : la comparaison recalcule les deux periodes
 * quand l'historique ne les porte pas. C'est la seule des trois lectures d'historique qui
 * ne depende pas de la capture, et c'est pour cela qu'elle n'affiche pas le bandeau
 * d'explication du classement.</p>
 */
export function ComparaisonPeriodes({
  moisAffiche,
  sens,
  tri,
}: {
  moisAffiche: string | null;
  sens: SensTri;
  tri: TriClassement;
}) {
  const {
    comparaison,
    isError,
    isFetching,
    isLoading,
    moisA,
    moisB,
    moisDisponibles,
    ordreValide,
    refetch,
    setMoisA,
    setMoisB,
  } = useComparaisonClassement({ moisAffiche, sens, tri });

  const selecteur = (
    valeur: string,
    onChange: (v: string) => void,
    etiquette: string,
    aide: string,
  ) => (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {etiquette}
      </span>
      <ComboBox
        aria-label={etiquette}
        className="w-56"
        onSelectionChange={(cle) => onChange(cle ? String(cle) : '')}
        selectedKey={valeur || null}
      >
        <ComboBox.InputGroup>
          <Input placeholder="Choisir un mois" />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox items={moisDisponibles}>
            {(m: { cle: string; libelle: string }) => (
              <ListBox.Item id={m.cle} textValue={m.libelle}>
                <span className="capitalize">{m.libelle}</span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
      <span className="text-[11px] text-muted">{aide}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Card.Content className="flex-row flex-wrap items-start gap-6">
          {selecteur(moisA, setMoisA, 'Période de référence', 'la plus ancienne')}
          <ArrowRight aria-hidden="true" className="mt-7 size-4 shrink-0 text-muted" />
          {selecteur(moisB, setMoisB, 'Période comparée', 'la plus récente')}
          <p className="mt-7 max-w-xs text-xs text-muted">
            Les écarts se lisent de la référence vers la période comparée. Le classement des
            deux mois est établi sur le {LIBELLE_TRI[tri]}, comme le tableau principal.
          </p>
        </Card.Content>
      </Card>

      {!ordreValide ? (
        <p className="py-8 text-center text-sm text-muted">
          La période de référence doit précéder la période comparée. Sans cet ordre, chaque écart
          de l&apos;écran changerait de signe sans que rien ne le dise.
        </p>
      ) : isLoading ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <Spinner />
          <p className="text-sm text-muted">Comparaison des deux périodes…</p>
        </div>
      ) : isError ? (
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="la comparaison" />
      ) : comparaison ? (
        <>
          {/* ── L'ensemble, indicateur par indicateur ─────────────────────────────── */}
          <Card>
            <Card.Content className="p-0">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label={`Écarts d'ensemble entre ${libelleMois(moisA)} et ${libelleMois(moisB)}`}
                    className="min-w-[40rem]"
                  >
                    <Table.Header>
                      <Table.Column id="indicateur" isRowHeader>
                        Indicateur
                      </Table.Column>
                      <Table.Column className="text-right" id="a">
                        <span className="capitalize">{libelleMois(moisA)}</span>
                      </Table.Column>
                      <Table.Column className="text-right" id="b">
                        <span className="capitalize">{libelleMois(moisB)}</span>
                      </Table.Column>
                      <Table.Column className="text-right" id="ecart">
                        Écart
                      </Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {INDICATEURS_COMPARAISON.map((indicateur) => {
                        const signe = indicateur.signe(comparaison.ecartsTotaux);
                        const pct = indicateur.pct(comparaison.ecartsTotaux);
                        const ton =
                          signe === null || signe === 0
                            ? 'text-muted'
                            : signe > 0
                              ? 'text-green-800 dark:text-green-400'
                              : 'text-red-800 dark:text-red-400';
                        return (
                          <Table.Row id={indicateur.cle} key={indicateur.cle}>
                            <Table.Cell>{indicateur.libelle}</Table.Cell>
                            <Table.Cell className="text-right tabular-nums text-muted">
                              {indicateur.valeur(comparaison.totauxA)}
                            </Table.Cell>
                            <Table.Cell className="text-right font-semibold tabular-nums text-foreground">
                              {indicateur.valeur(comparaison.totauxB)}
                            </Table.Cell>
                            <Table.Cell className={cn('text-right tabular-nums', ton)}>
                              {indicateur.ecart(comparaison.ecartsTotaux)}
                              {pct !== null && (
                                <span className="ms-1 text-[11px]">({pourcentageSigne(pct)})</span>
                              )}
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </Card.Content>
          </Card>

          {/* ── Le detail, partenaire par partenaire ──────────────────────────────── */}
          <Card>
            <Card.Content className="p-0">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content
                    aria-label={`Comparaison par partenaire entre ${libelleMois(moisA)} et ${libelleMois(moisB)}`}
                    className="min-w-[58rem]"
                  >
                    <Table.Header>
                      {COLONNES_COMPARAISON.map((c, i) => (
                        <Table.Column
                          className={cn(c.nombre && 'text-right')}
                          id={c.cle}
                          isRowHeader={i === 0}
                          key={c.cle}
                        >
                          {c.libelle}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body
                      renderEmptyState={() => (
                        <p className="py-8 text-center text-sm text-muted">
                          Aucun partenaire sur ces deux périodes.
                        </p>
                      )}
                    >
                      {comparaison.lignes.map((ligne) => (
                        <Table.Row id={ligne.restaurantId} key={ligne.restaurantId}>
                          {COLONNES_COMPARAISON.map((c) => (
                            <Table.Cell className={cn(c.nombre && 'text-right')} key={c.cle}>
                              {c.rendu(ligne)}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>

                <Table.Footer className="text-xs text-muted">
                  Chaque cellule porte la période comparée en gras, puis la référence et
                  l&apos;écart. Un partenaire présent d&apos;un seul côté reste dans la liste, sans
                  écart : le comparer à une période où il n&apos;existait pas inventerait une chute
                  ou une envolée.
                </Table.Footer>
              </Table>
            </Card.Content>
          </Card>
        </>
      ) : null}
    </div>
  );
}
