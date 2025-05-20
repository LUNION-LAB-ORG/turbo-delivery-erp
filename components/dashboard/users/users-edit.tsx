'use client';

import IconX from '@/components/icon/icon-x';
import { getAllRoles } from '@/src/actions/roles.actions';
import { _createUserSchema, createUserSchema } from '@/src/schemas/users.schema';
import { Role, User } from '@/types/models';
import { Transition, Dialog, TransitionChild, DialogPanel } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import React, { Fragment, useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Controller, useForm } from 'react-hook-form';

const UsersEdit = ({ user, open, setOpen }: { user: User; open: boolean; setOpen: (open: boolean) => void }) => {
    const { pending } = useFormStatus();

    const [state, formAction] = useFormState(
        async (_: any, formData: FormData) => {
            // const result = await changePassword(formData);

            // if (result.status === 'success') {
            //     toast.success(result.message || 'Bravo ! vous avez réussi');
            //     router.refresh();
            // } else {
            //     toast.error(result.message || "Erreur lors de l'envoi de l'email");
            // }

            // return result;
            return _;
        },
        {
            data: null,
            message: '',
            errors: {},
            status: 'idle',
            code: undefined,
        },
    );

    const [roles, setRoles] = useState<Role[]>([]);

    const rolesSelections = roles.map((r) => ({
        label: r.libelle,
        value: r.id,
    }));

    useEffect(() => {
        async function fetchRole() {
            const result = await getAllRoles();
            if (result) {
                setRoles(result);
            }
        }
        fetchRole();
    }, []);

    const {
        formState: { errors },
        control,
    } = useForm<_createUserSchema>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: user.username,
            name: user.nom,
            prenoms: user.prenoms,
            email: user.email,
            role: user.role.id,
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
                                <div className="bg-[#fbfbfb] py-3 text-lg font-medium ltr:pl-5 ltr:pr-[50px] rtl:pl-[50px] rtl:pr-5 dark:bg-[#121c2c] text-primary">Ajouter un utilisateur</div>
                                <form action={formAction}>
                                    <div className="grid gap-4 p-5">
                                        <Controller
                                            control={control}
                                            name="username"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.username ? 'true' : 'false'}
                                                    aria-label="username input"
                                                    errorMessage={errors.username?.message ?? ''}
                                                    isInvalid={!!errors.username}
                                                    label="Nom d'utilisateur"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez le nom d'utilisateur"
                                                    name="username"
                                                    type="text"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="name"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.name ? 'true' : 'false'}
                                                    aria-label="name input"
                                                    errorMessage={errors.name?.message ?? ''}
                                                    isInvalid={!!errors.name}
                                                    label="Nom"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez le nom"
                                                    name="name"
                                                    type="text"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="prenoms"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.prenoms ? 'true' : 'false'}
                                                    aria-label="prenoms input"
                                                    errorMessage={errors.prenoms?.message ?? ''}
                                                    isInvalid={!!errors.prenoms}
                                                    label="Prénoms"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez le prénom"
                                                    name="prenoms"
                                                    type="text"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="email"
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired
                                                    aria-invalid={errors.email ? 'true' : 'false'}
                                                    aria-label="email input"
                                                    errorMessage={errors.email?.message ?? ''}
                                                    isInvalid={!!errors.email}
                                                    label="Email"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez l'email"
                                                    name="email"
                                                    type="email"
                                                    variant="bordered"
                                                    radius="sm"
                                                    value={field.value ?? ''}
                                                />
                                            )}
                                        />
                                        <Controller
                                            control={control}
                                            name="role"
                                            render={({ field }) => (
                                                <Select
                                                    {...field}
                                                    isRequired
                                                    required
                                                    errorMessage={errors.role?.message ?? ''}
                                                    isInvalid={!!errors.role}
                                                    name="role"
                                                    className="w-full"
                                                    label="Rôle"
                                                    labelPlacement="outside"
                                                    placeholder="Entrez le rôle"
                                                    variant="bordered"
                                                    radius="sm"
                                                >
                                                    {rolesSelections.map((role) => (
                                                        <SelectItem key={role.value} textValue={role.label} value={role.value}>
                                                            {role.label}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />

                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setOpen(false)}>
                                                Annuler
                                            </button>
                                            <Button aria-disabled={pending} className="btn btn-primary ltr:ml-4 rtl:mr-4" color="primary" disabled={pending} isLoading={pending} type="submit">
                                                Ajouter
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

export default UsersEdit;
