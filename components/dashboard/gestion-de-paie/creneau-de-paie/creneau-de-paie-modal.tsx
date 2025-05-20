import { dayOfWeek } from "@/app/(protected)/external_delivery/gestion_de_paie/controller";
import { Button, Dropdown, Table, DropdownItem, DropdownMenu, DropdownTrigger, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import { Printer, ChevronRight, ChevronLeft, Banknote } from "lucide-react";
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
            <Modal isOpen={isOpen} size={"xl"} onClose={onClose}>
                <ModalContent>
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-center text-primary font-bold text-sm">Créneau de paie du {periode} </ModalHeader>
                        <ModalBody>
                            <div className="flex  justify-center gap-4 items-center">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button variant="bordered" className="min-w-[150px] flex justify-between rounded-full border-gray-300 bg-gray-300 h-8">
                                            <ChevronLeft className="text-gray-500" size={15} />{ctrl.daySelected}  <ChevronRight className="text-gray-500" size={15} /></Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Périodes"
                                        onAction={(key) => ctrl.setDaySelected(key as string)}
                                    >
                                        {
                                            dayOfWeek && dayOfWeek.map((day) => (
                                                <DropdownItem key={day}>{day}</DropdownItem>
                                            ))
                                        }
                                    </DropdownMenu>
                                </Dropdown>
                                <div className="text-gray-400" style={{ fontSize: 15 }}>Gain du jour <span className="text-primary  !text-md font-bold">
                                    {ctrl.gainParJours ? ctrl.gainParJours.map((item) => {
                                        let gainTotal = 0;
                                        gainTotal = item.commission ? gainTotal + item.commission : gainTotal
                                        return gainTotal
                                    })[0] : 0} FCFA</span></div>
                            </div>
                            <div className="max-h-[500px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableColumn>Date et heure</TableColumn>
                                        <TableColumn>Tickets</TableColumn>
                                        <TableColumn>Cout de livraison</TableColumn>
                                        <TableColumn>Commission</TableColumn>
                                    </TableHeader>
                                    <TableBody>
                                        {ctrl.gainParJours && ctrl.gainParJours.map((item: GainVm, index: number) => (
                                            <TableRow key={index} className={"hover:bg-primary/10"} >
                                                <TableCell className="border-b-2 text-gray-500 text-sm">
                                                    <div className="flex items-center gap-2"><Banknote size={18} />{item.date && moment(item.date).format("DD/MM/YYYY HH:mm")}</div>
                                                </TableCell>
                                                <TableCell className="border-b-2 text-gray-500 font-bold text-sm">{item.code}</TableCell>
                                                <TableCell className="border-b-2 text-gray-500 font-bold text-sm">{item.frais}&nbsp;&nbsp; FCFA</TableCell>
                                                <TableCell className="border-b-2 text-gray-500 font-bold text-sm">
                                                    <div className="flex flex-col text-green-500">
                                                        <span className="text-sm">{item.commission}&nbsp;&nbsp; FCFA</span>
                                                        <span style={{ fontSize: 10 }} className="-mt-2">Commission</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ModalBody>
                        <ModalFooter className="flex justify-center">
                            <Button variant="light" className="text-sm text-gray-500 border-1 mt-5 mb-3" size="sm" onPress={onClose}>
                                <Printer size={18} className="mr-2" /> Imprimer
                            </Button>
                        </ModalFooter>
                    </>
                </ModalContent>
            </Modal>
        </>
    )
}