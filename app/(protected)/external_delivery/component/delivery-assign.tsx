'use client';

import IconX from '@/components/icon/icon-x';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { Button } from "@heroui/react";
import React, { Fragment, useState } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { assignCourseExterne } from '@/src/actions/courses.actions';

const DeliveryAssign = ({ delivery, delivers, open, setOpen }: { delivery: CourseExterne; delivers: LivreurDisponible[]; open: boolean; setOpen: (open: boolean) => void }) => {
    const [pending, setPending] = useState(false);
    const [selectedDeliverer, setSelectedDeliverer] = useState('');
    const [deliveryPrice, setDeliveryPrice] = useState('');
    const router = useRouter();

    const handleSubmit = async () => {
        if (!selectedDeliverer) {
            toast.error('Veuillez sélectionner un livreur');
            return;
        }

        if (!deliveryPrice || isNaN(Number(deliveryPrice)) || Number(deliveryPrice) <= 0) {
            toast.error('Veuillez entrer un prix de livraison valide');
            return;
        }

        try {
            const result = await assignCourseExterne(delivery.id, selectedDeliverer, Number(deliveryPrice));

            if (result.status === 'success') {
                toast.success(result.message || 'Course assignée avec succès');
                router.refresh();
                setOpen(false);
            } else {
                toast.error(result.message || "Erreur lors de l'assignation de la course");
            }
        } catch (error) {
            toast.error("Une erreur est survenue lors de l'assignation");
        } finally {
            setPending(false);
        }
    };

    console.log("delivery, delivers", delivery, delivers)
    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" open={open} onClose={() => setOpen(false)} className="relative z-50">
                <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-[black]/60" />
                </TransitionChild>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center px-4 py-8">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="panel w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="absolute top-4 text-gray-400 outline-none hover:text-gray-800 ltr:right-4 rtl:left-4 dark:hover:text-gray-600"
                                >
                                    <IconX />
                                </button>
                                <div className="bg-[#fbfbfb] py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5 dark:bg-[#121c2c] text-primary">Assigner la course</div>
                                <div className="p-5">
                                    <div className="mb-5">
                                        <label className="block mb-2 text-sm font-medium">Sélectionner un livreur</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={selectedDeliverer}
                                            onChange={(e) => setSelectedDeliverer(e.target.value)}
                                        >
                                            <option value="">Choisir un livreur</option>
                                            {delivers.map((deliverer) => (
                                                <option key={deliverer.livreurId} value={deliverer.livreurId}>
                                                    {deliverer.nomComplet} - {deliverer.telephone}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-5">
                                        <label className="block mb-2 text-sm font-medium">Prix de livraison (XOF)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={deliveryPrice}
                                            onChange={(e) => setDeliveryPrice(e.target.value)}
                                            placeholder="Entrez le prix de livraison"
                                        />
                                    </div>

                                    <div className="mt-8 flex items-center justify-end gap-4">
                                        <button type="button" className="btn btn-outline-danger" onClick={() => setOpen(false)}>
                                            Annuler
                                        </button>
                                        <Button className="btn btn-primary" color="primary" disabled={pending} isLoading={pending} onClick={handleSubmit}>
                                            Assigner
                                        </Button>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default DeliveryAssign;
