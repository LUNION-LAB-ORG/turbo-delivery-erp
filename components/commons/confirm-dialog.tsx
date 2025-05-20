import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";


interface Props {
    isOpen?: boolean,
    message?: string,
    handleConfirm?: () => void,
    handleCancel: () => void,
    setIsOpen?: (isOpen: boolean) => void,

}

export const ConfirmDialog = (props: Props) => (
    <Modal isOpen={props.isOpen} size={"sm"} onClose={() => props.setIsOpen && props.setIsOpen(!props.isOpen)}>
        <ModalContent>
            <>
                <ModalHeader className="text-sm">Confirmation ?</ModalHeader>
                <ModalBody>
                    {
                        props.message ? props.message : "Etes-vous sûr de vouloir faire cette action ?"
                    }
                </ModalBody>
                <ModalFooter>
                    <Button size='sm' onPress={props.handleCancel}>Non</Button>
                    <Button color="danger" size='sm' onPress={props.handleConfirm}>Oui</Button>
                </ModalFooter>
            </>
        </ModalContent>
    </Modal>
)