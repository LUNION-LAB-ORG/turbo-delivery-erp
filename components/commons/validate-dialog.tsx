
// }

import { useOuverture } from '@/hooks/use-ouverture';
import React from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,Select,
    SelectItem,
} from "@/components/heroui";
import { Restaurant } from "@/types/models";


interface ValidateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    nomComplet: string;
    restaurants: Restaurant[];
    setRestaurantId: (id: string) => void;
    valider: (demandeAssignationId: string) => void;
    rejeter: (demandeAssignationId: string) => void;
    demandeAssignationId: string;
    estAccorder?: boolean;
}
export default function ValidateDialog({
    isOpen, onClose, nomComplet, restaurants,
    setRestaurantId, valider, rejeter, demandeAssignationId, estAccorder }: ValidateDialogProps) {
    const handleChange = (event: any): void => {
        setRestaurantId(event.target.value)
    }
    return (
        <Modal isOpen={isOpen} size={"sm"} onClose={onClose}>
            <ModalContent>
                <ModalBody className="p-5">
                    <h2 className="text-red-600 text-lg font-bold">Demande d’assignation</h2>
                    {
                        estAccorder ?
                            <p className="text-foreground">Autoriser le livreur <span className="font-semibold">{nomComplet}</span> </p>
                            :
                            <>
                                <p className="text-foreground mb-2">Attribuer le livreur <span className="font-semibold">{nomComplet}</span> en tant que :</p>
                                <Select label="Selectionnée un restaurant" size="sm" onChange={handleChange}>
                                    {restaurants.map((item) => (
                                        <SelectItem key={item.id} className="h-8" >{item.nomEtablissement}</SelectItem>
                                    ))}
                                </Select>
                            </>
                    }
                    <div className="mt-2 flex gap-3 justify-around">
                        <Button className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 h-8 w-full"
                            onPress={() => valider(demandeAssignationId)}>{estAccorder ? "Accorder" : "Accepter"}</Button>
                        <Button className="bg-surface-tertiary text-foreground py-2 px-4 rounded-lg h-8 w-full" onPress={() => {
                            rejeter(demandeAssignationId)
                            onClose()
                        }}>Rejeter</Button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}


