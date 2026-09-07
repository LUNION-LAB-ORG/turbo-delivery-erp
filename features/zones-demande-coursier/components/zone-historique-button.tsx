'use client';

import { useState } from 'react';
import { Button, Modal, Table, Tooltip } from '@heroui-v3/react';
import { History } from 'lucide-react';
import EtatErreur from '@/components/commons/EtatErreur';
import { useZoneHistoriqueQuery } from '../queries/zones-demande-coursier.query';
import { formatMontant } from '@/utils/format.utils';

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR');
};

interface ZoneHistoriqueButtonProps {
  fraisId?: string;
  zoneLabel?: string;
}

export default function ZoneHistoriqueButton({ fraisId, zoneLabel }: ZoneHistoriqueButtonProps) {
  const [open, setOpen] = useState(false);
  // `data === null` EST le signal d echec ici : l action avale l exception et
  // renvoie null. `isError` ne se declenche donc que si l appel casse plus tot.
  const { data, isLoading, isError, isFetching, refetch } = useZoneHistoriqueQuery(fraisId ?? null, open);
  const historique = data ?? [];

  if (!fraisId) return null;

  return (
    <>
      <Tooltip>
        {/* C'etait un `<button>` nu, sans nom accessible, dont l'apparence tenait a
            `text-default-400 active:opacity-50` — donc aucun etat de focus visible. */}
        <Button
          aria-label={`Historique des tarifs${zoneLabel ? ` de ${zoneLabel}` : ''}`}
          isIconOnly
          onPress={() => setOpen(true)}
          size="sm"
          variant="ghost"
        >
          <History aria-hidden="true" className="size-5" />
        </Button>
        <Tooltip.Content>Historique des tarifs</Tooltip.Content>
      </Tooltip>

      <Modal isOpen={open} onOpenChange={(o) => !o && setOpen(false)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <div className="flex flex-col gap-0.5">
                  <Modal.Heading>Historique des tarifs</Modal.Heading>
                  {zoneLabel && <span className="text-sm text-muted">{zoneLabel}</span>}
                </div>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body>
                {isLoading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        className="h-10 animate-pulse rounded-lg bg-surface-secondary"
                        key={i}
                      />
                    ))}
                  </div>
                ) : isError || data === null ? (
                  <EtatErreur
                    enCours={isFetching}
                    onReessayer={() => void refetch()}
                    quoi="l’historique des tarifs"
                  />
                ) : (
                  <Table>
                    <Table.ScrollContainer>
                      <Table.Content aria-label="Historique des tarifs de la zone">
                        <Table.Header>
                          <Table.Column id="periode" isRowHeader>
                            Période
                          </Table.Column>
                          {/* Une colonne de montants : elle s'aligne a droite en chasse
                              tabulaire, sinon deux tarifs ne se comparent qu'en comptant
                              les chiffres. */}
                          <Table.Column className="text-right" id="tarif">
                            Tarif FCFA
                          </Table.Column>
                        </Table.Header>
                        <Table.Body
                          renderEmptyState={() => (
                            <p className="py-8 text-center text-sm text-muted">
                              Aucun historique
                            </p>
                          )}
                        >
                          {historique.map((item, index) => (
                            <Table.Row
                              id={`${item.debut}-${index}`}
                              key={`${item.debut}-${index}`}
                            >
                              <Table.Cell>
                                {item.fin
                                  ? `Du ${formatDate(item.debut)} au ${formatDate(item.fin)}`
                                  : `Du ${formatDate(item.debut)}, en cours`}
                              </Table.Cell>
                              <Table.Cell className="text-right tabular-nums">
                                {formatMontant(item.prixFcfa)}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                )}
              </Modal.Body>

              <Modal.Footer>
                <Button onPress={() => setOpen(false)} variant="ghost">
                  Fermer
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
