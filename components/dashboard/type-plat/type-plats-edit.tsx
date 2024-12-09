'use client';

import IconX from '@/components/icon/icon-x';
import { updateTypePlat } from '@/src/actions/type-plats.actions';
import { _createTypePlatSchema, createTypePlatSchema } from '@/src/schemas/type-plats.schema';
import { TypePlat } from '@/types/models';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@nextui-org/react';
import { useRouter } from 'next/navigation';
import React, { Fragment } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const TypePlatEdit = ({ typePlat, open, setOpen }: { typePlat: TypePlat; open: boolean; setOpen: (open: boolean) => void }) => {
    const { pending } = useFormStatus();
    const router = useRouter();

    const [state, formAction] = useFormState(
        async (prevState: any, formData: FormData) => {
            const result = await updateTypePlat(prevState, formData, typePlat.id);

            if (result.status === 'success') {
                toast.success(result.message || 'Bravo ! vous avez réussi');
                router.refresh();
                setOpen(false);
            } else {
                toast.error(result.message || "Erreur lors de l'envoi de l'email");
            }

            return result;
        },
        {
            data: null,
            message: '',
            errors: {},
            status: 'idle',
            code: undefined,
        },
    );

    const {
        formState: { errors },
        control,
    } = useForm<_createTypePlatSchema>({
        resolver: zodResolver(createTypePlatSchema),
        defaultValues: {
            libelle: typePlat.libelle,
            description: typePlat.description,
            picture: undefined,
        },
    });

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
                                <div className="bg-[#fbfbfb] py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5 dark:bg-[#121c2c] text-primary">Modifier un type de plat</div>
                                <form action={formAction}>
                                    <div className="grid gap-4 p-5">
                                        <Controller
                                            control={control}
                                            name="libelle"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.libelle ? 'true' : 'false'}
                                                    aria-label="libelle input"
                                                    errorMessage={errors.libelle?.message ?? ''}
                                                    isInvalid={!!errors.libelle}
                                                    label="Libellé"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez le libellé"
                                                    name="libelle"
                                                    type="text"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="description"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.description ? 'true' : 'false'}
                                                    aria-label="description input"
                                                    errorMessage={errors.description?.message ?? ''}
                                                    isInvalid={!!errors.description}
                                                    label="Description"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez la description"
                                                    name="description"
                                                    type="text"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="picture"
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.picture ? 'true' : 'false'}
                                                    aria-label="picture input"
                                                    errorMessage={errors.picture?.message ?? ''}
                                                    isInvalid={!!errors.picture}
                                                    label="Image"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez l'image"
                                                    name="picture"
                                                    type="file"
                                                    accept=".png,.jpeg,.jpg"
                                                    variant="bordered"
                                                    radius="sm"
                                                    onChange={(e) => onChange(e.target.files?.[0])}
                                                />
                                            )}
                                        />

                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setOpen(false)}>
                                                Annuler
                                            </button>
                                            <Button aria-disabled={pending} className="btn btn-primary ltr:ml-4 rtl:mr-4" color="primary" disabled={pending} isLoading={pending} type="submit">
                                                Modifier
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default TypePlatEdit;
