import { dayOfWeek } from "@/app/(protected)/external_delivery/gestion_de_paie/controller";
import { Button, Dropdown, Modal, Table } from '@heroui-v3/react';
import { Banknote } from 'lucide-react';
import { useCreneauDePaieController } from "./controller";
import { GainHebdomadaireVm, GainVm } from "@/types/gestion-de-paie.model";
import moment from "moment";

interface CreneauDePaieModalProps {
    isOpen: boolean;
    onClose: () => void;
    gainsHedomadaires?: GainHebdomadaireVm;
    periode?: string;
}
export function CreneauDePaieModal({ gainsHedomadaires, isOpen, onClose, periode }: CreneauDePaieModalProps) {
    const ctrl = useCreneauDePaieController(gainsHedomadaires);
    return (
        <>
            <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="max-w-3xl">
                            <Modal.Header>
                                {/* Le titre etait centre et peint en ROUGE DE MARQUE. */}
                                <Modal.Heading>Créneau de paie du {periode}</Modal.Heading>
                                <Modal.CloseTrigger />
                            </Modal.Header>

                            <Modal.Body className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center justify-center gap-4">
                                    {/*
                                     * Les deux chevrons etaient DANS le bouton qui ouvre la
                                     * liste des jours : ils n'avaient aucun gestionnaire et
                                     * ne servaient qu'a decorer, tout en donnant a croire
                                     * qu'on pouvait naviguer d'un jour a l'autre. Le menu
                                     * fait deja le travail.
                                     */}
                                    <Dropdown>
                                        <Button className="min-w-[150px]" variant="outline">
                                            {ctrl.daySelected}
                                        </Button>
                                        <Dropdown.Popover>
                                            <Dropdown.Menu
                                                aria-label="Jour du créneau"
                                                onAction={(key) => ctrl.setDaySelected(String(key))}
                                            >
                                                {(dayOfWeek ?? []).map((day) => (
                                                    <Dropdown.Item id={day} key={day} textValue={day}>
                                                        {day}
                                                    </Dropdown.Item>
                                                ))}
                                            </Dropdown.Menu>
                                        </Dropdown.Popover>
                                    </Dropdown>

                                    <div className="text-sm text-muted">
                                        Gain du jour{' '}
                                        {/* Le montant etait peint en ROUGE DE MARQUE. */}
                                        <span className="font-bold tabular-nums text-foreground">
                                            {ctrl.gainParJours
                                                ? ctrl.gainParJours.map((item) => item.commission ?? 0)[0] ?? 0
                                                : 0}{' '}
                                            FCFA
                                        </span>
                                    </div>
                                </div>

                                <Table>
                                    <Table.ScrollContainer className="max-h-[500px]">
                                        <Table.Content aria-label="Créneau de paie">
                                            <Table.Header>
                                                <Table.Column id="date" isRowHeader>
                                                    Date et heure
                                                </Table.Column>
                                                <Table.Column id="tickets">Tickets</Table.Column>
                                                {/* Deux colonnes de montants : alignees a droite,
                                                    en chasse tabulaire. */}
                                                <Table.Column className="text-right" id="frais">
                                                    Coût de livraison
                                                </Table.Column>
                                                <Table.Column className="text-right" id="commission">
                                                    Commission
                                                </Table.Column>
                                            </Table.Header>
                                            <Table.Body
                                                renderEmptyState={() => (
                                                    <p className="py-8 text-center text-sm text-muted">
                                                        Aucune course sur ce jour
                                                    </p>
                                                )}
                                            >
                                                {(ctrl.gainParJours ?? []).map((item: GainVm, index: number) => (
                                                    <Table.Row id={String(index)} key={index}>
                                                        <Table.Cell>
                                                            <div className="flex items-center gap-2 text-sm text-muted">
                                                                <Banknote aria-hidden="true" size={18} />
                                                                {item.date && moment(item.date).format('DD/MM/YYYY HH:mm')}
                                                            </div>
                                                        </Table.Cell>
                                                        <Table.Cell className="text-sm font-bold text-foreground">
                                                            {item.code}
                                                        </Table.Cell>
                                                        <Table.Cell className="text-right text-sm font-bold tabular-nums text-foreground">
                                                            {item.frais} FCFA
                                                        </Table.Cell>
                                                        {/* Le montant etait en `text-green-500`, avec le mot
                                                            « Commission » repete SOUS chaque valeur — alors
                                                            que c'est deja le titre de la colonne. */}
                                                        <Table.Cell className="text-right text-sm font-bold tabular-nums text-foreground">
                                                            {item.commission} FCFA
                                                        </Table.Cell>
                                                    </Table.Row>
                                                ))}
                                            </Table.Body>
                                        </Table.Content>
                                    </Table.ScrollContainer>
                                </Table>
                            </Modal.Body>

                            {/*
                             * Le pied portait un bouton « Imprimer » dont le gestionnaire
                             * etait `onPress={onClose}` : il fermait la fenetre sans rien
                             * imprimer. C'est le meme leurre que celui deja retire de la
                             * fenetre parente, et documente la-bas.
                             */}
                            <Modal.Footer>
                                <Button onPress={onClose} variant="ghost">
                                    Fermer
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    )
}