'use client';

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
import { AlertTriangle, CheckCircle2, Download, Landmark, PiggyBank, ScrollText } from 'lucide-react';
import { useState } from 'react';
import * as XLSX from 'xlsx';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import {
  type EtatRapprochement,
  useAttestationsCaisseQuery,
  useEnregistrerAttestationMutation,
  useVerificationDepotsQuery,
} from '@/features/orientation-fonds';
import { formatMontant } from '@/utils/format.utils';

import { type OngletOrientation, OngletsOrientation } from './table-orientation';

/**
 * Verification des depots : le bouclage banque + caisse.
 *
 * <h3>Pourquoi des onglets</h3>
 * <p>L'ecran empilait TROIS tableaux : le rapprochement banque, le suivi de caisse et le
 * registre des attestations de comptage. On n'atteignait le troisieme qu'au defilement, et
 * le registre disparaissait entierement tant qu'aucune attestation n'avait ete posee, si
 * bien que rien n'annoncait son existence. Chaque tableau est desormais un onglet qui dit
 * son compte et son montant, le registre compris : vide, il le dit, il ne s'efface plus.</p>
 *
 * <p>Le bandeau de bouclage, lui, reste AU-DESSUS des onglets : il ne decrit aucune des
 * trois listes, il dit si elles se recoupent (vise = depose + conserve). Le mettre dans un
 * onglet reviendrait a cacher la question que l'ecran pose. Ce raisonnement ne vaut que du
 * total vise et du bouclage : les deux cartes qui reprenaient le total depose et le total
 * conserve repetaient les onglets a deux cents pixels d'ecart, et sont parties.</p>
 *
 * <h3>Ou est la couleur, et pourquoi</h3>
 * <p>Elle a change de place, pas de quantite. Les icones de section etaient peintes (un
 * cochon orange, une coche verte) pour designer une CATEGORIE : une couleur qui nomme un
 * type ne dit rien, elles passent en neutre. En revanche un montant depose qui ne tombe
 * pas sur le montant vise est de l'argent manquant, et une conservation dormante est une
 * anciennete qui appelle un geste : ces deux chiffres-la prennent le ton du danger, la
 * meme famille que la carte de bouclage et que la colonne d'ecart du registre.</p>
 *
 * <p>La meme regle vaut pour les JETONS et pour les etats normaux, ce que la premiere
 * passe avait manque : « Concordant » et un ecart de comptage NUL sont des categories
 * descriptives, et ce sont les cas majoritaires. Peints en vert, ils lavaient une colonne
 * entiere d'une couleur qui n'appelle aucun geste. Ils sont neutres.</p>
 */

function fmtDate(iso: null | string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch {
    return iso;
  }
}

/*
 * Le jeton d'etat, et pourquoi « Concordant » est NEUTRE.
 *
 * « Concordant » est une CATEGORIE descriptive, et c'est le cas majoritaire : peint en
 * vert, la colonne d'etat se lave de vert sur presque chaque ligne, et cette couleur
 * n'appelle aucun geste. C'est la meme faussete que l'icone verte retiree plus haut, a
 * ceci pres qu'elle se repete a chaque ligne. Restent colorees les trois valeurs qui
 * appellent un geste : le bordereau et la preuve qui manquent, et l'ecart de montant.
 */
const ETAT_BANQUE: Record<
  EtatRapprochement,
  { color: 'danger' | 'default' | 'warning'; label: string }
> = {
  BORDEREAU_MANQUANT: { color: 'danger', label: 'Bordereau manquant' },
  CONCORDANT: { color: 'default', label: 'Concordant' },
  ECART_MONTANT: { color: 'danger', label: 'Écart de montant' },
  PREUVE_MANQUANTE: { color: 'warning', label: 'Preuve manquante' },
};

/*
 * Le squelette de chargement compte ses cellules SUR CES LISTES. Un compte tenu a la main
 * derive des qu'on ajoute une colonne, et React Aria leve « Cell count must match column
 * count », ce qui emporte la page entiere en 500.
 */
const COLONNES_BANQUE = ['visa', 'bordereau', 'partenaire', 'vise', 'depose', 'date', 'etat'] as const;
const COLONNES_CAISSE = ['visa', 'partenaire', 'montant', 'motif', 'anciennete', 'etat'] as const;

/** Le titre d'un panneau : ce que la liste contient, et l'icone qui la repere. */
function EnTetePanneau({
  children,
  icone: Icone,
}: {
  children: React.ReactNode;
  icone: typeof Landmark;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* L'icone REPERE une liste, elle n'annonce ni alerte ni succes : elle est neutre. */}
      <Icone aria-hidden="true" className="size-4 shrink-0 text-muted" />
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

export default function VerificationDepotsView() {
  const { data, isError, isFetching, isLoading, refetch } = useVerificationDepotsQuery();
  // `isError` etait laisse de cote : quand la lecture du registre echouait, l'onglet
  // annoncait « 0 » et le panneau AFFIRMAIT « Aucune attestation de comptage enregistree ».
  // Sur un registre de comptage de caisse, affirmer le vide est pire que le cacher.
  const {
    data: attestations,
    isError: attestationsEnErreur,
    isFetching: attestationsEnRelance,
    isLoading: attestationsEnCours,
    refetch: relancerAttestations,
  } = useAttestationsCaisseQuery();
  const attester = useEnregistrerAttestationMutation();

  const [attestOpen, setAttestOpen] = useState(false);
  const [montantCompte, setMontantCompte] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [onglet, setOnglet] = useState('banque');

  const banque = data?.orientesBanque ?? [];
  const caisse = data?.conservesCaisse ?? [];
  const synthese = data?.synthese;
  const registre = attestations ?? [];

  // sans cette garde, un echec afficherait des totaux a 0 et un bouclage « Anomalie »
  // faussement rouge. Les cartes rendent un tiret plutot que d'affirmer zero. La relance
  // vit dans les panneaux qui lisent les depots, et une ligne compacte la porte au-dessus
  // des onglets quand c'est le registre qui est ouvert.
  const zoneErreur = (
    <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="la vérification des dépôts" />
  );

  const handleAttester = () => {
    const montant = Number(montantCompte);
    if (Number.isNaN(montant) || montant < 0) return;
    attester.mutate(
      { commentaire: commentaire.trim() || undefined, montantComptePhysique: montant },
      {
        onSuccess: () => {
          setAttestOpen(false);
          setMontantCompte('');
          setCommentaire('');
        },
      },
    );
  };

  const exportXlsx = () => {
    const wb = XLSX.utils.book_new();
    const shA = XLSX.utils.json_to_sheet(
      banque.map((l) => ({
        'N° visa': l.numeroVisa ?? '',
        'N° bordereau': l.numeroBordereau ?? '',
        Partenaire: l.partenaire,
        'Montant visé': l.montantVise,
        'Montant déposé': l.montantDepose,
        'Date dépôt': fmtDate(l.dateDepot),
        Banque: l.banqueAgence ?? '',
        Preuve: l.preuvePresente ? 'Oui' : 'Non',
        État: ETAT_BANQUE[l.etatRapprochement].label,
      })),
    );
    XLSX.utils.book_append_sheet(wb, shA, 'Orientés banque');
    const shB = XLSX.utils.json_to_sheet(
      caisse.map((l) => ({
        'N° visa': l.numeroVisa ?? '',
        Partenaire: l.partenaire,
        'Montant conservé': l.montantConserve,
        Motif: l.motif ?? '',
        'Ancienneté (j)': l.ancienneteJours,
        État: l.alerteDormant ? 'Dormant' : 'En caisse',
      })),
    );
    XLSX.utils.book_append_sheet(wb, shB, 'Conservés caisse');
    if (synthese) {
      const shS = XLSX.utils.json_to_sheet([
        {
          'Total visé': synthese.totalVise,
          'Total déposé': synthese.totalDepose,
          'Total conservé': synthese.totalConserve,
          'Écart bouclage': synthese.ecartBouclage,
          Bouclage: synthese.bouclageOk ? 'OK' : 'ANOMALIE',
        },
      ]);
      XLSX.utils.book_append_sheet(wb, shS, 'Synthèse');
    }
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const url = URL.createObjectURL(
      new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-depots_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Section A : les fonds orientes vers la banque. */
  const panneauBanque = isError ? (
    zoneErreur
  ) : (
    <div className="flex flex-col gap-3">
      <EnTetePanneau icone={Landmark}>Rapprochement N° de visa ↔ N° de bordereau</EnTetePanneau>

      <div className="overflow-hidden rounded-xl border border-separator bg-surface shadow-xs">
        <div className="hidden overflow-x-auto md:block">
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
                      {/*
                       * Le montant depose INFORME, sauf quand il ne tombe pas sur le
                       * montant vise : c'est alors de l'argent manquant, et c'est ce
                       * chiffre-la qu'on vient chercher. Il prend le ton du danger, la
                       * meme famille que la carte de bouclage et la colonne d'ecart.
                       */}
                      <Table.Cell
                        className={
                          l.etatRapprochement === 'ECART_MONTANT'
                            ? 'text-right font-semibold tabular-nums whitespace-nowrap text-danger-soft-foreground'
                            : 'text-right tabular-nums whitespace-nowrap'
                        }
                      >
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
        <div className="divide-y divide-separator md:hidden">
          {banque.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Aucun recouvrement orienté banque</p>
          ) : (
            banque.map((l) => (
              <div className="space-y-1.5 p-4" key={l.factureId}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{l.partenaire}</p>
                    <p className="text-[11px] text-muted">
                      Visa {l.numeroVisa ?? '—'} · Bord. {l.numeroBordereau ?? '—'}
                    </p>
                  </div>
                  <Chip color={ETAT_BANQUE[l.etatRapprochement].color} size="sm" variant="soft">
                    <Chip.Label>{ETAT_BANQUE[l.etatRapprochement].label}</Chip.Label>
                  </Chip>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Visé</span>
                  <span className="tabular-nums text-foreground">{formatMontant(l.montantVise)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Déposé</span>
                  {/* Meme regle qu'au poste de travail : l'ecart se dit de la meme facon. */}
                  <span
                    className={
                      l.etatRapprochement === 'ECART_MONTANT'
                        ? 'font-semibold tabular-nums text-danger-soft-foreground'
                        : 'tabular-nums text-foreground'
                    }
                  >
                    {formatMontant(l.montantDepose)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Date dépôt</span>
                  <span className="text-foreground">{fmtDate(l.dateDepot)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  /* Section B : les fonds conserves en caisse. */
  const panneauCaisse = isError ? (
    zoneErreur
  ) : (
    <div className="flex flex-col gap-3">
      <EnTetePanneau icone={PiggyBank}>
        Fonds gardés en caisse. Une conservation trop ancienne est signalée « Dormant »
      </EnTetePanneau>

      <div className="overflow-hidden rounded-xl border border-separator bg-surface shadow-xs">
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
                  <Table.Column className="text-right" id="anciennete">
                    Ancienneté
                  </Table.Column>
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
                          {COLONNES_CAISSE.map((c) => (
                            <Table.Cell key={`sqc-${i}-${c}`}>
                              <div className="h-4 animate-pulse rounded bg-surface-secondary" />
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))
                    : null}

                  {(isLoading ? [] : caisse).map((l) => (
                    <Table.Row id={l.factureId} key={l.factureId}>
                      <Table.Cell>{l.numeroVisa ?? '—'}</Table.Cell>
                      <Table.Cell>{l.partenaire}</Table.Cell>
                      <Table.Cell className="text-right tabular-nums whitespace-nowrap">
                        {formatMontant(l.montantConserve)}
                      </Table.Cell>
                      <Table.Cell>
                        <span className="line-clamp-2 block max-w-[260px] text-xs text-muted">
                          {l.motif ?? '—'}
                        </span>
                      </Table.Cell>
                      {/*
                       * L'anciennete est ce qui declenche l'alerte « Dormant » : quand
                       * elle la declenche, c'est le chiffre qui appelle le geste, et il
                       * prend le ton du danger. Sinon il informe, et reste neutre.
                       */}
                      <Table.Cell
                        className={
                          l.alerteDormant
                            ? 'text-right font-semibold tabular-nums whitespace-nowrap text-danger-soft-foreground'
                            : 'text-right tabular-nums whitespace-nowrap'
                        }
                      >
                        {l.ancienneteJours} j
                      </Table.Cell>
                      <Table.Cell>
                        <Chip color={l.alerteDormant ? 'danger' : 'default'} size="sm" variant="soft">
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
        <div className="divide-y divide-separator md:hidden">
          {caisse.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Aucun fonds conservé en caisse</p>
          ) : (
            caisse.map((l) => (
              <div className="space-y-1.5 p-4" key={l.factureId}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{l.partenaire}</p>
                    <p className="text-[11px] text-muted">
                      Visa {l.numeroVisa ?? '—'} ·{' '}
                      <span
                        className={
                          l.alerteDormant ? 'font-semibold text-danger-soft-foreground' : undefined
                        }
                      >
                        {l.ancienneteJours} j
                      </span>
                    </p>
                  </div>
                  <Chip color={l.alerteDormant ? 'danger' : 'default'} size="sm" variant="soft">
                    <Chip.Label>{l.alerteDormant ? 'Dormant' : 'En caisse'}</Chip.Label>
                  </Chip>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted">Montant</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMontant(l.montantConserve)}
                  </span>
                </div>
                {l.motif && <p className="line-clamp-2 text-[11px] text-muted">{l.motif}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  /*
   * Le registre des attestations. Il ne se montrait QUE s'il contenait quelque chose :
   * tant qu'aucun comptage n'avait ete pose, rien a l'ecran ne disait que ce registre
   * existait, ni que le bouton « Attestation de caisse » alimentait quelque chose. Vide,
   * l'onglet le dit desormais.
   */
  const panneauAttestations = attestationsEnErreur ? (
    <EtatErreur
      enCours={attestationsEnRelance}
      onReessayer={() => relancerAttestations()}
      quoi="le registre des attestations de caisse"
    />
  ) : (
    <div className="flex flex-col gap-3">
      <EnTetePanneau icone={CheckCircle2}>
        Comptages physiques enregistrés et leur écart au solde théorique
      </EnTetePanneau>

      <div className="overflow-hidden rounded-xl border border-separator bg-surface shadow-xs">
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
              <Table.Body
                renderEmptyState={() =>
                  attestationsEnCours ? null : (
                    <p className="py-8 text-center text-sm text-muted">
                      Aucune attestation de comptage enregistrée
                    </p>
                  )
                }
              >
                {registre.map((a) => (
                  <Table.Row id={a.id} key={a.id}>
                    <Table.Cell>{fmtDate(a.dateAttestation)}</Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {formatMontant(a.soldeTheorique)}
                    </Table.Cell>
                    <Table.Cell className="text-right tabular-nums">
                      {formatMontant(a.montantComptePhysique)}
                    </Table.Cell>
                    {/* Un ecart non nul est la SEULE chose que ce registre doit faire
                        voir : lui seul prend la couleur. Un ecart NUL est le cas normal
                        et majoritaire d'un comptage de caisse : le peindre en vert lave
                        la colonne d'une couleur qui n'appelle aucun geste et noie le seul
                        chiffre qu'on vient y chercher. */}
                    <Table.Cell
                      className={
                        a.ecart === 0
                          ? 'text-right tabular-nums'
                          : 'text-right font-semibold tabular-nums text-danger-soft-foreground'
                      }
                    >
                      {formatMontant(a.ecart)}
                    </Table.Cell>
                    <Table.Cell>{a.caissier}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </div>
  );

  /* Ce que chaque onglet annonce : son compte et ce qu'il pese. Le registre n'a pas de
     total, il annonce la date de sa derniere piece. Cette date est CALCULEE sur tout le
     registre : rien ne garantit que le serveur le rende trie, et « derniere le » serait
     alors faux. */
  const derniereAttestation = registre.reduce<null | string>(
    (recente, a) => (recente === null || a.dateAttestation > recente ? a.dateAttestation : recente),
    null,
  );

  const onglets: OngletOrientation[] = [
    {
      cle: 'banque',
      enChargement: isLoading,
      enErreur: isError,
      libelle: 'Orientés banque',
      montant: synthese?.totalDepose ?? 0,
      nombre: banque.length,
      panneau: panneauBanque,
      /*
       * Le libelle nomme l'ORIENTATION, le montant est le DEPOSE, et les deux different
       * exactement quand il y a une anomalie : cet ecran n'existe que pour cette
       * difference. Le montant dit donc lequel des deux il est. C'est aussi le seul
       * endroit ou le total depose est ecrit, depuis que le bandeau ne le repete plus.
       */
      precision: 'déposé',
    },
    {
      cle: 'caisse',
      enChargement: isLoading,
      enErreur: isError,
      libelle: 'Conservés en caisse',
      montant: synthese?.totalConserve ?? 0,
      nombre: caisse.length,
      panneau: panneauCaisse,
    },
    {
      cle: 'attestations',
      enChargement: attestationsEnCours,
      enErreur: attestationsEnErreur,
      libelle: 'Attestations de caisse',
      nombre: registre.length,
      panneau: panneauAttestations,
      precision: derniereAttestation ? `dernière le ${fmtDate(derniereAttestation)}` : undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted">Comptabilité</p>
          <h1 className="text-2xl font-bold text-foreground">Vérification dépôt en banque</h1>
          <p className="mt-0.5 text-sm text-muted">
            Rapprochement croisé N° de visa ↔ N° de bordereau, et suivi des fonds conservés en
            caisse.
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

      {/* Le bandeau de bouclage reste au-dessus des onglets : il ne decrit aucune des trois
          listes, il dit si elles se recoupent. Les cartes rendent un tiret quand la lecture
          echoue, jamais un zero.

          Il n'en reste que DEUX. « Total depose (banque) » et « Total conserve (caisse) »
          repetaient mot pour mot le montant deja porte par les onglets « Orientes banque »
          et « Conserves en caisse », a deux cents pixels d'ecart. C'est la raison meme pour
          laquelle le bandeau de l'ecran d'orientation a ete supprime. Ne survivent ici que
          les deux chiffres qu'aucun onglet ne porte : le total vise, qui n'est la somme
          d'aucune des trois listes, et le bouclage, qui dit si elles se recoupent. */}
      <GrilleStats colonnes={2}>
        <CarteStat
          isError={isError}
          isLoading={isLoading}
          libelle="Total visé"
          valeur={formatMontant(synthese?.totalVise ?? 0)}
        />
        {/* Le bouclage dit si la somme banque + caisse retombe sur le total vise.
            Il ne se peint que quand il NE retombe PAS : un rapprochement qui boucle est
            le cas normal et majoritaire, et le peindre en vert lave la carte d'une
            couleur qui n'appelle aucun geste. Meme regle que la pastille « Concordant »
            et que l'ecart nul, deux lignes plus bas. */}
        <CarteStat
          isError={isError}
          isLoading={isLoading}
          libelle="Bouclage"
          ton={synthese?.bouclageOk ? 'neutre' : 'danger'}
          valeur={synthese?.bouclageOk ? 'OK' : 'Anomalie'}
        >
          {/* L'ecart passait par `note`, que `CarteStat` fige en `text-default-400` : le
              montant par lequel on COMMENCE l'enquete restait gris sous une etiquette
              rouge. `children` est l'echappatoire prevue pour ce cas. Nul, l'ecart informe
              et reste neutre ; non nul, il prend le ton de son etiquette. */}
          {synthese && (
            <p className="mt-1.5 text-[11px] leading-tight text-default-400">
              Écart :{' '}
              <span
                className={
                  synthese.bouclageOk
                    ? 'tabular-nums text-foreground'
                    : 'font-semibold tabular-nums text-danger-soft-foreground'
                }
              >
                {formatMontant(synthese.ecartBouclage)}
              </span>
            </p>
          )}
        </CarteStat>
      </GrilleStats>

      {synthese && !synthese.bouclageOk && (
        <div className="flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger-soft-foreground">
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          Total visé ≠ Total déposé + Total conservé : anomalie à investiguer (opération visée ni
          déposée ni conservée, ou double comptage).
        </div>
      )}

      {/* La relance des depots vit dans les panneaux « banque » et « caisse ». Depuis
          l'onglet des attestations, qui ne lit pas les depots, un echec ne se lisait plus
          que dans les tirets des cartes et dans deux onglets « indisponible » : il fallait
          CHANGER D'ONGLET pour reparer. Sur un ecran d'argent, la reparation reste sous la
          main. La ligne ne parait que la ou la relance manque, pour ne pas la dire deux
          fois sur les deux autres onglets. */}
      {isError && onglet === 'attestations' && (
        <EtatErreur
          compact
          enCours={isFetching}
          onReessayer={() => refetch()}
          quoi="la vérification des dépôts"
        />
      )}

      <OngletsOrientation onSelection={setOnglet} onglets={onglets} selection={onglet} />

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
