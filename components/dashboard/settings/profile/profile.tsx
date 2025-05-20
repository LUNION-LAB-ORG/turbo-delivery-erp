'use client';

import React, { useState } from 'react';
import IconCalendar from '@/components/icon/icon-calendar';
import IconPencilPaper from '@/components/icon/icon-pencil-paper';
import { User } from '@/types/models';
import { Avatar, Input } from "@heroui/react";
import { SubmitButton } from '@/components/ui/form-ui/submit-button';
import { IconMail, IconShield, IconUser } from '@tabler/icons-react';

const UserProfile = ({ user }: { user: User }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        setIsEditing(false);
    };

    return (
        <div className="pt-5">
            <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3 xl:grid-cols-4">
                <div className="panel lg:col-span-2 xl:col-span-3">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold dark:text-white-light">Profil</h5>
                        <button onClick={() => setIsEditing(!isEditing)} className="btn btn-primary rounded-full p-2 ltr:ml-auto rtl:mr-auto">
                            <IconPencilPaper />
                        </button>
                    </div>
                    <div className="mb-5">
                        <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-start">
                            <div className="mb-5 h-20 w-20 flex-none">
                                <Avatar src={user.image} alt="img" className="mx-auto h-20 w-20 rounded-full object-cover" />
                            </div>
                            <div className="flex flex-col items-center text-center sm:items-start sm:px-4 sm:text-left">
                                <p className="text-xl font-semibold text-primary">{`${user.username}`}</p>
                                <p className="font-medium flex items-center gap-2">
                                    <IconShield size={16} /> Rôle : {user.role.libelle}
                                </p>
                            </div>
                        </div>
                        {isEditing ? (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                                className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
                            >
                                <Input
                                    labelPlacement="outside"
                                    variant="bordered"
                                    name="nom"
                                    isRequired
                                    required
                                    // errorMessage={state?.errors?.password ?? ''}
                                    // isInvalid={!!state?.errors?.password}
                                    label="Nom"
                                    value={user.nom}
                                />

                                <Input labelPlacement="outside" variant="bordered" name="prenoms" isRequired required label="Prénoms" value={user.prenoms} />
                                <Input labelPlacement="outside" variant="bordered" name="email" isRequired required label="Email" value={user.email} />
                                <Input labelPlacement="outside" variant="bordered" name="username" isRequired required label="Nom d'utilisateur" value={user.username} />
                                <div className="sm:col-span-2">
                                    <SubmitButton>Enregistrer</SubmitButton>
                                </div>
                            </form>
                        ) : (
                            <ul className="m-auto mt-5 flex max-w-[160px] flex-col space-y-4 font-semibold sm:max-w-none">
                                <li className="flex items-center gap-2">
                                    <IconCalendar className="shrink-0" />
                                    Date de création: {new Date(user.dateCreation).toLocaleDateString()}
                                </li>
                                <li className="flex items-center gap-2">
                                    <IconUser className="shrink-0" />
                                    Nom & prénoms: {user.nom} {user.prenoms}
                                </li>
                                <li>
                                    <button className="flex items-center gap-2">
                                        <IconMail className="shrink-0" />
                                        <span className="truncate text-primary">{user.email}</span>
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
