import { Button, DatePicker, Modal, ModalBody, ModalContent, Select, SelectItem } from "@heroui/react";
import { Controller } from "react-hook-form";
import { useReportingController } from "./controller";
import { SelectField } from '@/components/commons/form/select-field';
import { Restaurant } from "@/types/models";

interface Props {
    isOpen?: boolean;
    onClose: () => void;
    restaurant?: Restaurant;
    type?: string;
}
export function TicketTermineReportingDialog({ isOpen, onClose, restaurant, type }: Props) {
    const ctrl = useReportingController(restaurant, type);

    return (
        <Modal isOpen={isOpen} size={"md"} onClose={onClose} >
            <ModalContent>
                <ModalBody className="p-5">
                    <div className="text-center text-primary">Imprimez les bons de livraison du restaurant: <span className="font-bold">{restaurant ? restaurant?.nomEtablissement : "Aucun restaurant"}</span></div>
                    <div className="grid grid-cols-1 gap-4 mt-4">
                        <Controller name="debut" control={ctrl.form.control}
                            render={({ field }) =>
                                <DatePicker className="w-full" label="Date de debut" onChange={(value: any) => {
                                    if (value?.year && value?.month && value?.day) {
                                        const nativeDate = new Date(value.year, value?.month - 1, value.day);
                                        field.onChange(nativeDate?.toISOString().slice(0, 10))
                                    } else {
                                        field.onChange(value?.toString());
                                    }
                                }} />}
                        />
                        <Controller name="fin" control={ctrl.form.control}
                            render={({ field }) =>
                                <DatePicker className="w-full" label="Date de fin" onChange={(value: any) => {
                                    if (value?.year && value?.month && value?.day) {
                                        const nativeDate = new Date(value.year, value?.month - 1, value.day);
                                        field.onChange(nativeDate?.toISOString().slice(0, 10))
                                    } else {
                                        field.onChange(value?.toString());
                                    }
                                }} />}
                        />
                        {
                            (type && type !== "commande-terminer") &&
                            <div>
                                <div className="mb-2 text-sm ml-2">Selectionnez un type</div>
                                <Select className="max-w-lg" aria-label="Type sélectionné" defaultSelectedKeys={[type]}
                                    isDisabled  >
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                </Select>
                            </div>
                        }
                        <Controller name="format" control={ctrl.form.control}
                            render={({ field }) =>
                                <div className="w-full ">
                                    <div className="mb-2 text-sm ml-2">Selectionnez un format</div>
                                    <SelectField className="w-full" label="id" id="format"
                                        options={[
                                            { label: "PDF", id: "PDF" },
                                            { label: "EXCEL", id: "EXCEL" }
                                        ]} setValue={field.onChange} value={field.value} />
                                </div>
                            } />
                    </div>
                    <div className="flex justify-end mt-10">
                        <div className="flex gap-2">
                            <Button onPress={ctrl.onPreview} className="h-10  text-md" disabled={!!(ctrl.form.watch("format") === "EXCEL")}>Previsuliser</Button>
                            <Button onPress={ctrl.onexportFile} className="h-10 bg-primary text-white font-bold text-md">Exporter</Button>
                        </div>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}