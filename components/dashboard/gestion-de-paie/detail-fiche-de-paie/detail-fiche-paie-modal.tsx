import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Card,
    Chip,
} from "@heroui/react";
import { MoveDownLeft, MoveDownRight, MoveUpRight, Printer } from "lucide-react";
import { useInitierPaiementController } from "./controller";
import { InitierPaiementModal } from "../initier-paiement/initier-paiement-modal";
import { CreneauDePaieModal } from "../creneau-de-paie/creneau-de-paie-modal";
import { GainHebdomadaireVm, GainParJour, PaieParLivreur } from "@/types/gestion-de-paie.model";

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
            <Modal isOpen={isOpen} size={"2xl"} onClose={onClose}>
                <ModalContent>
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-center text-primary font-bold">Détail de la fiche de paie</ModalHeader>
                        <ModalBody>
                            {
                                ctrl.detailFichePaie ?
                                    <div className="pl-4 pr-4">
                                        <div className="flex justify-between mb-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-500 font-bold text-xl">{ctrl.detailFichePaie?.nomPrenom}</span>
                                                <span className="text-sm">Lieur de travail <span className="text-gray-500 font-bold">{ctrl.detailFichePaie?.lieuTravail ?? ""}</span></span>
                                            </div>
                                            {
                                                nonEligible ?
                                                    <Chip className="bg-purple-100 text-purple-800  ml-2 mr-2"><span className="font-[900]">A encaissé</span></Chip>
                                                    :
                                                    <Chip className="bg-yellow-50 text-orange-500 font-bold">Paie en attente</Chip>
                                            }
                                        </div>
                                        <div className="flex gap-20 mb-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Commssion</div>
                                                <div className="text-md text-gray-500 font-bold">{ctrl.detailFichePaie?.commission ?? 0}&nbsp;&nbsp; FCFA</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Prime</div>
                                                {ctrl.detailFichePaie?.prime && ctrl.detailFichePaie?.prime > 0 ? <span className="ml-1 flex gap-1 text-green-500"><MoveUpRight className="text-green-500" size={16} /> + {ctrl.detailFichePaie?.prime}&nbsp;&nbsp; FCFA</span>
                                                    : <span className="ml-1 flex gap-1 text-red-500"> <MoveDownRight className="text-red-500" size={16} /> + {ctrl.detailFichePaie?.prime ?? 0}&nbsp;&nbsp;  FCFA</span>}

                                            </div>
                                        </div>

                                        <div className="flex gap-20 mb-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Total réalisé</div>
                                                <div className="text-md  text-gray-500">{ctrl.detailFichePaie?.totalRealise ?? 0}&nbsp;&nbsp; FCFA</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500">Gain initial</div>
                                                <span className="text-md  text-gray-500">{ctrl.detailFichePaie?.gainInitial ?? 0}&nbsp;&nbsp;  FCFA</span>

                                            </div>
                                        </div>
                                        <Card className="p-4">
                                            <div className="flex items-center justify-between mb-4" >
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-gray-500">Total a payer</div>
                                                    <div className="text-md  font-bold text-gray-500">{ctrl.detailFichePaie?.gainInitial ?? 0} FCFA</div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div>Date de récupéreration</div>
                                                    <div className="flex justify-end">
                                                        <div className="text-sm  font-bold text-gray-500">...</div>
                                                    </div>
                                                </div>
                                            </div>
                                            {
                                                (ctrl.detailFichePaie?.gainFicheVM && ctrl.detailFichePaie?.gainFicheVM?.gains) &&
                                                ctrl.detailFichePaie?.gainFicheVM?.gains.map((item: GainParJour, index: number) => (
                                                    <div key={index} onClick={() => ctrl.onpenCrennauxDialog(ctrl.detailFichePaie?.gainFicheVM)} className="cursor-pointer">
                                                        <div className="flex justify-between mt-2 border-b-2 pb-2 text-md hover:bg-primary/10" >
                                                            <div className="text-sm">{item.jour + " " + (index + 1)}</div>
                                                            <div className="text-sm font-bold text-gray-500">{item.gain?.frais}&nbsp;&nbsp;  FCFA</div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </Card>
                                    </div>
                                    : <span className="text-center text-primry font-bold">Aucun details pour cette fiche de paie</span>
                            }
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" className="text-sm" size="sm" onPress={onClose}>
                                <Printer size={18} className="mr-2" />  Imprimer
                            </Button>
                            <Button color="primary" className="text-sm" onPress={ctrl.initierPaiementClosure.onOpen} size="sm">
                                Initier le paiement
                            </Button>
                        </ModalFooter>
                    </>
                    <InitierPaiementModal onClose={ctrl.initierPaiementClosure.onClose} isOpen={ctrl.initierPaiementClosure.isOpen} details={details} />
                    <CreneauDePaieModal onClose={ctrl.creneauDePaieClosure.onClose} isOpen={ctrl.creneauDePaieClosure.isOpen} gainsHedomadaires={ctrl.gainsHedomadaires} periode={periode} />
                </ModalContent>
            </Modal>
        </>
    );
}

