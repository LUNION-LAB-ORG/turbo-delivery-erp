'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Button,
  Chip,
  Label,
  Modal,
  NumberField,
  Spinner,
  Table,
  TextArea,
} from '@heroui-v3/react';
import { Download, ScrollText, AlertTriangle, CheckCircle2, Landmark, PiggyBank } from 'lucide-react';
import {
  useVerificationDepotsQuery,
  useAttestationsCaisseQuery,
  useEnregistrerAttestationMutation,
  type EtatRapprochement,
} from '@/features/orientation-fonds';
import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { formatMontant } from '@/utils/format.utils';
import EtatErreur from '@/components/commons/EtatErreur';

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR'); } catch { return iso; }
}

const ETAT_BANQUE: Record<EtatRapprochement, { label: string; color: 'success' | 'warning' | 'danger' }> = {
  CONCORDANT: { label: 'Concordant', color: 'success' },
  BORDEREAU_MANQUANT: { label: 'Bordereau manquant', color: 'danger' },
  PREUVE_MANQUANTE: { label: 'Preuve manquante', color: 'warning' },
  ECART_MONTANT: { label: 'Écart de montant', color: 'danger' },
};

/*
 * Le squelette de chargement compte ses cellules SUR CES LISTES. Un compte tenu a la main
 * derive des qu'on ajoute une colonne, et React Aria leve « Cell count must match column
 * count », ce qui emporte la page entiere en 500.
 */
const COLONNES_BANQUE = ['visa', 'bordereau', 'partenaire', 'vise', 'depose', 'date', 'etat'] as const;
const COLONNES_CAISSE = ['visa', 'partenaire', 'montant', 'motif', 'anciennete', 'etat'] as const;

export default function VerificationDepotsView() {
  const { data, isLoading, isError, isFetching, refetch } = useVerificationDepotsQuery();
  const { data: attestations } = useAttestationsCaisseQuery();
  const attester = useEnregistrerAttestationMutation();

  const [attestOpen, setAttestOpen] = useState(false);
  const [montantCompte, setMontantCompte] = useState('');
  const [commentaire, setCommentaire] = useState('');

  const banque = data?.orientesBanque ?? [];
  const caisse = data?.conservesCaisse ?? [];
  const synthese = data?.synthese;

  // sans cette garde, un echec afficherait des totaux a 0 et un bouclage "Anomalie" faussement rouge
  const zoneErreur = <EtatErreur quoi="la vérification des dépôts" onReessayer={() => refetch()} enCours={isFetching} />;

  const handleAttester = () => {
    const montant = Number(montantCompte);
    if (Number.isNaN(montant) || montant < 0) return;
    attester.mutate(
      { montantComptePhysique: montant, commentaire: commentaire.trim() || undefined },
      { onSuccess: () => { setAttestOpen(false); setMontantCompte(''); setCommentaire(''); } },
    );
  };

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();
    const shA = XLSX.utils.json_to_sheet(banque.map((l) => ({
      'N° visa': l.numeroVisa ?? '', 'N° bordereau': l.numeroBordereau ?? '', Partenaire: l.partenaire,
      'Montant visé': l.montantVise, 'Montant déposé': l.montantDepose, 'Date dépôt': fmtDate(l.dateDepot),
      Banque: l.banqueAgence ?? '', Preuve: l.preuvePresente ? 'Oui' : 'Non', État: ETAT_BANQUE[l.etatRapprochement].label,
    })));
    XLSX.utils.book_append_sheet(wb, shA, 'Orientés banque');
    const shB = XLSX.utils.json_to_sheet(caisse.map((l) => ({
      'N° visa': l.numeroVisa ?? '', Partenaire: l.partenaire, 'Montant conservé': l.montantConserve,
      Motif: l.motif ?? '', 'Ancienneté (j)': l.ancienneteJours, État: l.alerteDormant ? 'Dormant' : 'En caisse',
    })));
    XLSX.utils.book_append_sheet(wb, shB, 'Conservés caisse');
    if (synthese) {
      const shS = XLSX.utils.json_to_sheet([{
        'Total visé': synthese.totalVise, 'Total déposé': synthese.totalDepose,
        'Total conservé': synthese.totalConserve, 'Écart bouclage': synthese.ecartBouclage,
        Bouclage: synthese.bouclageOk ? 'OK' : 'ANOMALIE',
      }]);
      XLSX.utils.book_append_sheet(wb, shS, 'Synthèse');
    }
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const url = URL.createObjectURL(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a');
    a.href = url; a.download = `verification-depots_${new Date().toISOString().split('T')[0]}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Comptabilité</p>
          <h1 className="text-2xl font-bold text-foreground">Vérification dépôt en banque</h1>
          <p className="text-sm text-muted mt-0.5">
            Rapprochement croisé N° de visa ↔ N° de bordereau, et suivi des fonds conservés en caisse.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* INVERSION ASSUMEE des deux boutons : l'accent etait sur « Exporter Excel », il
              passe a « Attestation de caisse ». L'accent va au geste qui ENGAGE : attester
              un comptage physique ecrit une piece datee, signee et comparee au solde
              theorique. Un export ne change rien, il recopie. Les deux gestes restent la,
              seul le poids visuel change, et l'ordre suit (le geste accentue en dernier). */}
          <Button isDisabled={isLoading} onPress={exportXlsx} variant="outline">
            <Download aria-hidden="true" className="size-4" />
            Exporter Excel
          </Button>
          <Button onPress={() => setAttestOpen(true)} variant="primary">
            <ScrollText aria-hidden="true" className="size-4" />
            Attestation de caisse
          </Button>
        </div>
      </div>

      {isError ? (
        zoneErreur
      ) : (
        <>
        {/* Bandeau de bouclage */}
        <GrilleStats className="md:grid-cols-4" colonnes={4}>
          <CarteStat
            libelle="Total visé"
            valeur={formatMontant(synthese?.totalVise ?? 0)}
            isLoading={isLoading}
          />
          <CarteStat
            libelle="Total déposé (banque)"
            valeur={formatMontant(synthese?.totalDepose ?? 0)}
            isLoading={isLoading}
          />
          <CarteStat
            libelle="Total conservé (caisse)"
            valeur={formatMontant(synthese?.totalConserve ?? 0)}
            isLoading={isLoading}
          />
          {/* Le bouclage est le seul chiffre colore de ce bandeau : il dit si la
              somme banque + caisse retombe sur le total vise. */}
          <CarteStat
            libelle="Bouclage"
            valeur={synthese?.bouclageOk ? 'OK' : 'Anomalie'}
            note={synthese ? `Écart : ${formatMontant(synthese.ecartBouclage)}` : undefined}
            ton={synthese?.bouclageOk ? 'succes' : 'danger'}
            isLoading={isLoading}
          />
        </GrilleStats>
        {synthese && !synthese.bouclageOk && (
          <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-soft-foreground">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Total visé ≠ Total déposé + Total conservé : anomalie à investiguer (opération visée ni déposée ni conservée, ou double comptage).
          </div>
        )}

        {/* Section A : les fonds orientes vers la banque */}
        <section className="bg-surface rounded-xl border border-separator shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-separator">
            <Landmark aria-hidden="true" className="size-4 text-muted" />
            <p className="font-semibold text-foreground">Recouvrements orientés banque</p>
            <span className="text-xs text-muted">· rapprochement visa ↔ bordereau</span>
          </div>
          <div className="overflow-x-auto hidden md:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Rapprochement banque" className="min-w-[48rem]">
                  <Table.Header>
                    <Table.Column id="visa" isRowHeader>
                      N° visa
                    </Table.Column>
                    <Table.Column id="bordereau">N° bordereau</Table.Column>
                    <Table.Column id="partenaire">Partenaire</Table.Column>
                    <Table.Column className="text-right" id="vise">
                      Visé
                    </Table.Column>
                    <Table.Column className="text-right" id="depose">
                      Déposé
                    </Table.Column>
                    <Table.Column id="date">Date</Table.Column>
                    <Table.Column id="etat">État</Table.Column>
                  </Table.Header>

                  <Table.Body
                    renderEmptyState={() =>
                      isLoading ? null : (
                        <p className="py-8 text-center text-sm text-muted">
                          Aucun recouvrement orienté banque
                        </p>
                      )
                    }
                  >
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <Table.Row id={`sq-${i}`} key={`sq-${i}`}>
                            {COLONNES_BANQUE.map((c) => (
                              <Table.Cell key={`sq-${i}-${c}`}>
                                <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))
                      : null}

                    {(isLoading ? [] : banque).map((l) => (
                      <Table.Row id={l.factureId} key={l.factureId}>
                        <Table.Cell>{l.numeroVisa ?? '—'}</Table.Cell>
                        <Table.Cell>
                          {l.numeroBordereau ?? <span className="text-muted">—</span>}
                        </Table.Cell>
                        <Table.Cell>{l.partenaire}</Table.Cell>
                        <Table.Cell className="text-right tabular-nums whitespace-nowrap">
                          {formatMontant(l.montantVise)}
                        </Table.Cell>
                        <Table.Cell className="text-right tabular-nums whitespace-nowrap">
                          {formatMontant(l.montantDepose)}
                        </Table.Cell>
                        <Table.Cell>{fmtDate(l.dateDepot)}</Table.Cell>
                        <Table.Cell>
                          <Chip
                            color={ETAT_BANQUE[l.etatRapprochement].color}
                            size="sm"
                            variant="soft"
                          >
                            <Chip.Label>{ETAT_BANQUE[l.etatRapprochement].label}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
          {/* Telephone : cartes en lecture seule */}
          <div className="md:hidden divide-y divide-separator">
            {banque.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Aucun recouvrement orienté banque</p>
            ) : banque.map((l) => (
              <div key={l.factureId} className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{l.partenaire}</p>
                    <p className="text-[11px] text-muted">Visa {l.numeroVisa ?? '—'} · Bord. {l.numeroBordereau ?? '—'}</p>
                  </div>
                  <Chip color={ETAT_BANQUE[l.etatRapprochement].color} size="sm" variant="soft">
                    <Chip.Label>{ETAT_BANQUE[l.etatRapprochement].label}</Chip.Label>
                  </Chip>
                </div>
                <div className="flex justify-between text-xs"><span className="text-muted">Visé</span><span className="tabular-nums text-foreground">{formatMontant(l.montantVise)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted">Déposé</span><span className="tabular-nums text-foreground">{formatMontant(l.montantDepose)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted">Date dépôt</span><span className="text-foreground">{fmtDate(l.dateDepot)}</span></div>
              </div>
            ))}
          </div>
        </section>

        {/* Section B : les fonds conserves en caisse */}
        <section className="bg-surface rounded-xl border border-separator shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-separator">
            <PiggyBank aria-hidden="true" className="size-4 text-warning-soft-foreground" />
            <p className="font-semibold text-foreground">Recouvrements conservés en caisse</p>
          </div>
          <div className="hidden md:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Suivi caisse" className="min-w-[48rem]">
                  <Table.Header>
                    <Table.Column id="visa" isRowHeader>
                      N° visa
                    </Table.Column>
                    <Table.Column id="partenaire">Partenaire</Table.Column>
                    {/* La cellule est en `text-right tabular-nums` : sans le meme geste sur
                        l'en-tete, l'intitule flotte a gauche d'une colonne d'argent alignee
                        a droite. Le geste avait ete porte a la table d'a cote, pas ici. */}
                    <Table.Column className="text-right" id="montant">
                      Montant
                    </Table.Column>
                    <Table.Column id="motif">Motif</Table.Column>
                    <Table.Column id="anciennete">Ancienneté</Table.Column>
                    <Table.Column id="etat">État</Table.Column>
                  </Table.Header>

                  <Table.Body
                    renderEmptyState={() =>
                      isLoading ? null : (
                        <p className="py-8 text-center text-sm text-muted">
                          Aucun fonds conservé en caisse
                        </p>
                      )
                    }
                  >
                    {isLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <Table.Row id={`sqc-${i}`} key={`sqc-${i}`}>
                            {COLONNES_CAISSE.map(
                              (c) => (
                                <Table.Cell key={`sqc-${i}-${c}`}>
                                  <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                                </Table.Cell>
                              ),
                            )}
                          </Table.Row>
                        ))
                      : null}

                    {(isLoading ? [] : caisse).map((l) => (
                      <Table.Row id={l.factureId} key={l.factureId}>
                        <Table.Cell>{l.numeroVisa ?? '—'}</Table.Cell>
                        <Table.Cell>{l.partenaire}</Table.Cell>
                        <Table.Cell>
                          <span className="block whitespace-nowrap text-right tabular-nums">
                            {formatMontant(l.montantConserve)}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="line-clamp-2 block max-w-[260px] text-xs text-muted">
                            {l.motif ?? '—'}
                          </span>
                        </Table.Cell>
                        <Table.Cell>{l.ancienneteJours} j</Table.Cell>
                        <Table.Cell>
                          <Chip
                            color={l.alerteDormant ? 'danger' : 'default'}
                            size="sm"
                            variant="soft"
                          >
                            <Chip.Label>{l.alerteDormant ? 'Dormant' : 'En caisse'}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
          {/* Telephone : cartes en lecture seule */}
          <div className="md:hidden divide-y divide-separator">
            {caisse.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Aucun fonds conservé en caisse</p>
            ) : caisse.map((l) => (
              <div key={l.factureId} className="p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{l.partenaire}</p>
                    <p className="text-[11px] text-muted">Visa {l.numeroVisa ?? '—'} · {l.ancienneteJours} j</p>
                  </div>
                  <Chip color={l.alerteDormant ? 'danger' : 'default'} size="sm" variant="soft">
                    <Chip.Label>{l.alerteDormant ? 'Dormant' : 'En caisse'}</Chip.Label>
                  </Chip>
                </div>
                <div className="flex justify-between text-xs"><span className="text-muted">Montant</span><span className="font-semibold tabular-nums text-foreground">{formatMontant(l.montantConserve)}</span></div>
                {l.motif && <p className="text-[11px] text-muted line-clamp-2">{l.motif}</p>}
              </div>
            ))}
          </div>
        </section>
        </>
      )}

      {/* Registre des attestations de caisse */}
      {attestations && attestations.length > 0 && (
        <section className="bg-surface rounded-xl border border-separator shadow-xs overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-separator">
            <CheckCircle2 aria-hidden="true" className="size-4 text-success-soft-foreground" />
            <p className="font-semibold text-foreground">Attestations de comptage physique</p>
          </div>
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Attestations" className="min-w-[44rem]">
                <Table.Header>
                  <Table.Column id="date" isRowHeader>
                    Date
                  </Table.Column>
                  {/* Trois colonnes d'argent : les en-tetes s'alignent sur leurs cellules. */}
                  <Table.Column className="text-right" id="theorique">
                    Solde théorique
                  </Table.Column>
                  <Table.Column className="text-right" id="compte">
                    Compté
                  </Table.Column>
                  <Table.Column className="text-right" id="ecart">
                    Écart
                  </Table.Column>
                  <Table.Column id="caissier">Caissier</Table.Column>
                </Table.Header>
                <Table.Body>
                  {attestations.map((a) => (
                    <Table.Row id={a.id} key={a.id}>
                      <Table.Cell>{fmtDate(a.dateAttestation)}</Table.Cell>
                      <Table.Cell>
                        <span className="block text-right tabular-nums">
                          {formatMontant(a.soldeTheorique)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="block text-right tabular-nums">
                          {formatMontant(a.montantComptePhysique)}
                        </span>
                      </Table.Cell>
                      {/* Un ecart non nul est la SEULE chose que ce registre doit faire
                          voir : il garde sa couleur, en jeton. */}
                      <Table.Cell>
                        <span
                          className={
                            a.ecart !== 0
                              ? 'block text-right font-semibold tabular-nums text-danger-soft-foreground'
                              : 'block text-right tabular-nums text-success-soft-foreground'
                          }
                        >
                          {formatMontant(a.ecart)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{a.caissier}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </section>
      )}

      {/* La fenetre d'attestation de caisse */}
      <Modal isOpen={attestOpen} onOpenChange={setAttestOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-md">
              <Modal.Header>
                <Modal.Heading className="flex flex-col items-start gap-0">
                  <span className="text-lg font-bold text-foreground">Attestation de caisse</span>
                  <span className="text-sm font-normal text-muted">
                    Solde théorique : {formatMontant(synthese?.totalConserve ?? 0)} (somme des fonds
                    conservés)
                  </span>
                </Modal.Heading>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4">
                {/*
                 * Le montant compte remontait en CHAINE d'un `<input type="number">` :
                 * c'est un `NumberField`, dont les trois enfants sont obligatoires.
                 */}
                <NumberField
                  isRequired
                  minValue={0}
                  onChange={(v) => setMontantCompte(Number.isNaN(v) ? '' : String(v))}
                  value={montantCompte === '' ? Number.NaN : Number(montantCompte)}
                >
                  <Label>Montant physiquement compté (FCFA)</Label>
                  <NumberField.Group>
                    <NumberField.DecrementButton />
                    <NumberField.Input />
                    <NumberField.IncrementButton />
                  </NumberField.Group>
                </NumberField>

                <div className="flex flex-col gap-1">
                  <Label>Commentaire (facultatif)</Label>
                  <TextArea
                    onChange={(e) => setCommentaire(e.target.value)}
                    rows={2}
                    value={commentaire}
                  />
                </div>

                <p className="text-xs text-muted">
                  Le système calcule l&apos;écart avec le solde théorique ; tout écart est signalé
                  à la Direction.
                </p>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  isDisabled={attester.isPending}
                  onPress={() => setAttestOpen(false)}
                  variant="ghost"
                >
                  Annuler
                </Button>
                <Button
                  isDisabled={montantCompte.trim() === ''}
                  isPending={attester.isPending}
                  onPress={handleAttester}
                  variant="primary"
                >
                  {attester.isPending ? <Spinner size="sm" /> : null}
                  Enregistrer l&apos;attestation
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
