'use client';

import { Modal, Spinner, Table } from '@heroui-v3/react';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { cn } from '@/lib/utils';
import { COLONNES_EVOLUTION } from '@/features/classement-partenaires/components/evolution-table-columns';
import { useEvolutionPartenaireQuery } from '@/features/classement-partenaires/queries/classement.query';
import type { SensTri, TriClassement } from '@/features/classement-partenaires/types/classement.types';
import { libelleMois } from '@/features/classement-partenaires/utils/classement-format.utils';
import { LIBELLE_TRI } from '@/features/classement-partenaires/utils/classement-tri.utils';

/**
 * LA FICHE D'EVOLUTION D'UN PARTENAIRE : ses douze derniers mois clos.
 *
 * <h3>Ce que la fiche montre aujourd'hui</h3>
 * <p>Rien, et elle le DIT. La frise se lit exclusivement dans l'historique fige, et aucun
 * instantane n'a jamais ete capture. Rendre un tableau vide laisserait croire que le
 * partenaire n'a pas travaille depuis un an ; la fiche liste donc les mois qui manquent et
 * renvoie a la capture, qui est le geste qui les cree.</p>
 *
 * <h3>Le rang depend du critere de tri</h3>
 * <p>Le rang de chaque mois est RECALCULE sur le critere affiche, il n'est pas stocke. Un
 * partenaire peut monter en livraisons pendant qu'il descend en commission : la fiche
 * rappelle donc sur quel indicateur elle est lue, sans quoi la frise se lirait comme une
 * verite unique.</p>
 */
export function FicheEvolution({
  nom,
  onClose,
  restaurantId,
  sens,
  tri,
}: {
  nom: string;
  onClose: () => void;
  restaurantId: string | null;
  sens: SensTri;
  tri: TriClassement;
}) {
  const { data, isError, isFetching, isLoading, refetch } = useEvolutionPartenaireQuery(
    restaurantId,
    tri,
    sens,
  );

  const mois = data?.mois ?? [];
  const manquants = data?.moisSansInstantane ?? [];

  return (
    <Modal isOpen={Boolean(restaurantId)} onOpenChange={(ouvert) => !ouvert && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-5xl">
            <Modal.Header>
              <Modal.Heading className="flex flex-col gap-1">
                <span>Évolution de {nom}</span>
                <span className="text-xs font-normal text-muted">
                  Rang recalculé chaque mois sur le {LIBELLE_TRI[tri]}, sur les douze derniers mois
                  clos.
                </span>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <Spinner />
                  <p className="text-sm text-muted">Lecture de l&apos;historique…</p>
                </div>
              ) : isError ? (
                <EtatErreur
                  enCours={isFetching}
                  onReessayer={() => refetch()}
                  quoi="l'historique de ce partenaire"
                />
              ) : mois.length === 0 ? (
                <div className="flex flex-col gap-2 py-6">
                  <p className="text-sm text-foreground">
                    Aucun mois à afficher : la frise se lit dans l&apos;historique figé, et aucun
                    instantané n&apos;a encore été capturé.
                  </p>
                  <p className="text-sm text-muted">
                    Ce n&apos;est pas une absence d&apos;activité. Les chiffres de chaque mois
                    existent et restent calculables ; c&apos;est leur photographie mensuelle qui
                    manque, et c&apos;est elle que la frise lit.
                  </p>
                </div>
              ) : (
                <Table>
                  <Table.ScrollContainer>
                    <Table.Content
                      aria-label={`Évolution mensuelle de ${nom}`}
                      className="min-w-[48rem]"
                    >
                      <Table.Header>
                        {COLONNES_EVOLUTION.map((c, i) => (
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
                      <Table.Body>
                        {mois.map((m) => (
                          <Table.Row id={m.mois} key={m.mois}>
                            {COLONNES_EVOLUTION.map((c) => (
                              <Table.Cell
                                className={cn(c.nombre && 'text-right tabular-nums')}
                                key={c.cle}
                              >
                                {c.rendu(m)}
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Content>
                  </Table.ScrollContainer>
                </Table>
              )}

              {/*
               * Les mois manquants sont NOMMES, et non rendus a zero. Un mois absent n'est
               * pas un mois sans activite : le confondre avec un creux inventerait une
               * chute que personne n'a vecue.
               */}
              {!isLoading && !isError && manquants.length > 0 && (
                <p className="text-xs text-muted">
                  {manquants.length} mois sans instantané, absents de la frise :{' '}
                  <span className="text-foreground">
                    {manquants.map((m) => libelleMois(m)).join(', ')}
                  </span>
                  . Soit ils n&apos;ont jamais été capturés, soit l&apos;instantané de ce mois ne
                  classait pas ce partenaire.
                </p>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
