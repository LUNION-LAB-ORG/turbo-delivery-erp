import React from "react";
import { Button, Card, Chip, Modal } from '@heroui-v3/react';
import { MoveUpRight } from 'lucide-react';
import { useInitierPaiementController } from "./controller";
import { CreneauDePaieModal } from "../creneau-de-paie/creneau-de-paie-modal";
import { GainHebdomadaireVm, GainParJour, PaieParLivreur } from "@/types/gestion-de-paie.model";
import EtatErreur from "@/components/commons/EtatErreur";
import { formatMontant } from '@/utils/format.utils';

interface DetailFichePaieProps {
    isOpen: boolean;
    onClose: () => void;
    details?: PaieParLivreur;
    periode?: string;
    nonEligible: boolean
}

export function DetailFichePaieModal({ isOpen, onClose, details, periode, nonEligible }: DetailFichePaieProps) {
    const ctrl = useInitierPaiementController(details, isOpen);
    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="max-w-3xl">
                            <Modal.Header>
                                {/* Le titre etait centre et peint en ROUGE DE MARQUE. */}
                                <Modal.Heading>Détail de la fiche de paie</Modal.Heading>
                                <Modal.CloseTrigger />
                            </Modal.Header>

                            <Modal.Body>
                            {
                                // l'echec passe AVANT la donnee : un detail deja charge pour un
                                // autre livreur resterait sinon affiche sous le nouveau nom
                                ctrl.erreur ?
                                    <EtatErreur
                                        quoi="le détail de la fiche de paie"
                                        onReessayer={ctrl.reessayer}
                                        enCours={ctrl.chargement}
                                    />
                                    :
                                    ctrl.detailFichePaie ?
                                    <div className="flex flex-col gap-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xl font-bold text-foreground">{ctrl.detailFichePaie?.nomPrenom}</span>
                                                {/* « Lieur de travail » : la faute etait a l'ecran. */}
                                                <span className="text-sm text-muted">
                                                    Lieu de travail :{' '}
                                                    <span className="font-semibold text-foreground">
                                                        {ctrl.detailFichePaie?.lieuTravail ?? '—'}
                                                    </span>
                                                </span>
                                            </div>
                                            {/*
                                             * « A encaisse » etait peint en `bg-purple-100
                                             * text-purple-800` et « Paie en attente » en
                                             * `bg-yellow-50 text-orange-500` — du violet et
                                             * de l'orange, deux couleurs etrangeres a la
                                             * palette, et l'orange sur jaune tres pale.
                                             * Une paie en attente est le deroulement
                                             * NORMAL : elle ne s'alarme pas.
                                             */}
                                            {nonEligible ? (
                                                <Chip color="success" variant="soft">
                                                    <Chip.Label>À encaisser</Chip.Label>
                                                </Chip>
                                            ) : (
                                                <Chip variant="soft">
                                                    <Chip.Label>Paie en attente</Chip.Label>
                                                </Chip>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                            <div className="flex flex-col gap-1">
                                                {/* « Commssion » : la faute etait a l'ecran. */}
                                                <span className="text-xs tracking-wide text-muted uppercase">Commission</span>
                                                <span className="font-bold tabular-nums text-foreground">
                                                    {formatMontant(ctrl.detailFichePaie?.commission ?? 0)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs tracking-wide text-muted uppercase">Prime</span>
                                                {/*
                                                 * Une prime nulle s'affichait « + 0 FCFA » en
                                                 * ROUGE avec une fleche vers le BAS, comme une
                                                 * perte. Une prime est la, ou elle n'est pas.
                                                 */}
                                                {(ctrl.detailFichePaie?.prime ?? 0) > 0 ? (
                                                    <span className="flex items-center gap-1 font-bold tabular-nums text-success-soft-foreground">
                                                        <MoveUpRight aria-hidden="true" size={16} />
                                                        {formatMontant(ctrl.detailFichePaie?.prime ?? 0)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">Aucune prime</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs tracking-wide text-muted uppercase">Total réalisé</span>
                                                <span className="font-bold tabular-nums text-foreground">
                                                    {formatMontant(ctrl.detailFichePaie?.totalRealise ?? 0)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs tracking-wide text-muted uppercase">Gain initial</span>
                                                <span className="font-bold tabular-nums text-foreground">
                                                    {formatMontant(ctrl.detailFichePaie?.gainInitial ?? 0)}
                                                </span>
                                            </div>
                                        </div>

                                        <Card>
                                            <Card.Content className="gap-3 p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs tracking-wide text-muted uppercase">Total à payer</span>
                                                        <span className="text-lg font-bold tabular-nums text-foreground">
                                                            {formatMontant(ctrl.detailFichePaie?.gainInitial ?? 0)}
                                                        </span>
                                                    </div>
                                                    {/* ⚠ « Date de recupereration » (deux fautes) affichait
                                                        « ... » : la valeur n'a jamais ete branchee. */}
                                                    <div className="flex flex-col gap-1 text-right">
                                                        <span className="text-xs tracking-wide text-muted uppercase">Date de récupération</span>
                                                        <span className="text-sm text-muted">Non renseignée</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    {(ctrl.detailFichePaie?.gainFicheVM?.gains ?? []).map(
                                                        (item: GainParJour, index: number) => (
                                                            <button
                                                                className="flex items-center justify-between border-b border-separator py-2 text-left transition-colors last:border-b-0 hover:bg-surface-secondary"
                                                                key={index}
                                                                onClick={() =>
                                                                    ctrl.onpenCrennauxDialog(ctrl.detailFichePaie?.gainFicheVM)
                                                                }
                                                                type="button"
                                                            >
                                                                <span className="text-sm text-foreground">
                                                                    {item.jour} {index + 1}
                                                                </span>
                                                                <span className="text-sm font-bold tabular-nums text-foreground">
                                                                    {formatMontant(item.gain?.frais ?? 0)}
                                                                </span>
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </Card.Content>
                                        </Card>
                                    </div>
                                    : (
                                        /* La classe etait `text-primry` — une faute de frappe,
                                           donc aucune couleur appliquee. */
                                        <p className="py-8 text-center text-sm text-muted">
                                            Aucun détail pour cette fiche de paie
                                        </p>
                                    )
                            }
                            </Modal.Body>
                        {/*
                          * Pied VIDE de ses deux actions, et c'est voulu.
                          *
                          * « Imprimer » portait `onPress={onClose}` : il fermait la fenetre sans rien
                          * imprimer. « Initier le paiement » ouvrait une maquette dont le bouton
                          * « Envoyer » etait, lui aussi, `onPress={onClose}` — aucun appel d'API, aucune
                          * mutation. Cette maquette affichait un montant CONSTANT (« 290000 FCFA »)
                          * sous le VRAI nom du livreur et son VRAI numero Wave, et deux cases qui
                          * basculaient entre deux autres constantes en simulant un recalcul.
                          *
                          * Un comptable cochait, importait une signature (dont le `onChange` rendait la
                          * chaine vide), cliquait « Envoyer », et repartait en croyant avoir initie une
                          * paie. Rien n'etait parti, et rien ne le lui disait.
                          *
                          * Le VRAI module de paiement existe et vit ailleurs :
                          * `/finance/gestion-paiements` (features/gestion-paiements), expose dans le
                          * menu sous `read Paiement`, avec une vraie mutation `initierPaiement(ids, mois)`.
                          * Cet ecran-ci n'est pas dans le menu ; il n'est atteignable qu'en tapant son
                          * URL, la regle de prefixe `/external_delivery` (`read Commande`) le laissant
                          * passer. Il reste utile en LECTURE — le detail de la fiche est reel — donc on
                          * retire les leurres sans supprimer l'ecran.
                          */}
                            <Modal.Footer>
                                {/* « Fermer » etait peint en DANGER. */}
                                <Button onPress={onClose} variant="ghost">
                                    Fermer
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

            <CreneauDePaieModal
                gainsHedomadaires={ctrl.gainsHedomadaires}
                isOpen={ctrl.creneauDePaieClosure.isOpen}
                onClose={ctrl.creneauDePaieClosure.onClose}
                periode={periode}
            />
        </>
    );
}

