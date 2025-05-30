import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { ArrowDownToLine } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { useState } from "react";

interface InitierPaiementModalProps {
    isOpen: boolean;
    onClose: () => void;
    details: any;
}
export function InitierPaiementModal({ details, isOpen, onClose }: InitierPaiementModalProps) {
    const [payerTotalite, setPayerTotalite] = useState(false);
    const [payerEnDette, setPayerEnDette] = useState(true);

    return (
        <>
            <Modal isOpen={isOpen} size={"xl"} onClose={onClose}>
                <ModalContent>
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-center text-primary font-bold">Initier la paie</ModalHeader>
                        <ModalBody>
                            <div className="pl-4 pr-4">
                                <div className="flex justify-between mb-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-500 font-bold text-xl">{details && details?.nomComplet}</span>
                                        <span className="text-sm text-gray-500">Le paiement sera envoyé sur l&apos;interface d&apos;application du livreur</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-4 card p-4 border-1 rounded-lg">
                                    <Image src={"/assets/images/wave.png"} alt="" width={30} height={30} />
                                    <span className="text-gray-500 font-bold text-sm">{details.contact}</span>
                                </div>
                                <div className="p-4 border-1 rounded-lg">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-gray-400 text-sm">A payer</div>
                                        <div className="text-md  font-bold text-gray-500">290000 FCFA</div>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-5">
                                        <div className="flex gap-1">
                                            <Checkbox checked={!!(payerTotalite && !payerEnDette)}
                                                onClick={() => {
                                                    setPayerEnDette(false)
                                                    setPayerTotalite(true)
                                                }} /> <span className="text-sm text-gray-500">Payer la totalité</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <Checkbox checked={!!(payerEnDette && !payerTotalite)}
                                                onClick={() => {
                                                    setPayerTotalite(false)
                                                    setPayerEnDette(true)
                                                }} /> <span className="text-sm text-gray-500">Payer sur un montant</span>
                                        </div>
                                    </div>
                                </div>
                                {
                                    payerEnDette &&
                                    <div className="text-gray-500 text-xl text-center font-bold font mt-10">15.0000 FCFA</div>
                                }
                                {
                                    payerTotalite && <div className="text-gray-500 text-xl text-center font-bold font mt-10">0 FCFA</div>
                                }

                            </div>
                            <span className="text-gray-400 text-sm">Signature</span>
                            <div className="border-1 flex justify-center p-4 min-h-16 cursor-pointer">
                                <input type="file" id="input-file-upload" multiple={true} onChange={() => ""} className="hidden" />
                                <label id="label-file-upload" htmlFor="input-file-upload">
                                    <div className="flex gap-4"><ArrowDownToLine size={18} /><span className="text-gray-400 text-sm">Importer une signature</span></div>
                                </label>

                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" className="text-sm" size="sm" onPress={onClose}>
                                Annuler
                            </Button>
                            <Button color="primary" className="text-sm" onPress={onClose} size="sm">
                                Envoyer
                            </Button>
                        </ModalFooter>
                    </>
                </ModalContent>
            </Modal>
        </>
    )
}