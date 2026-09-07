'use client';

import React from 'react';
import IconCalendar from '@/components/icon/icon-calendar';
import { User } from '@/types/models';
import { Avatar } from '@heroui-v3/react';
import { IconMail, IconShield, IconUser } from '@tabler/icons-react';

import { CodeSecuriteCard } from './code-securite-card';

const UserProfile = ({ user }: { user: User }) => {
    // Le code de sécurité (actions finance sensibles) n'existe que pour DG / DGA.
    const peutDefinirCode = ['DG', 'DGA'].includes(user.role?.libelle ?? '');
    /*
     * Le mode edition a ete RETIRE, parce qu'il ne pouvait rien enregistrer.
     *
     * Les quatre champs etaient controles par `value={user.nom}` etc. SANS `onChange` :
     * React les rendait donc inertes, on ne pouvait pas y taper. Et `handleSave()` ne
     * faisait que refermer le formulaire — aucune requete n'etait envoyee, et aucune
     * action de mise a jour du profil n'existe dans le depot (verifie).
     *
     * Un formulaire qui promet d'enregistrer et n'enregistre rien est pire qu'une fiche
     * en lecture seule : l'utilisateur croit avoir sauvegarde. La fiche dit donc ce
     * qu'elle sait, et dit ou s'adresser pour la faire changer.
     */

    return (
        <div className="pt-5">
            <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3 xl:grid-cols-4">
                <div className="panel lg:col-span-2 xl:col-span-3">
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold dark:text-white-light">Profil</h5>
                        <span className="text-xs text-muted">
                            Pour modifier ces informations, adressez-vous à un administrateur.
                        </span>
                    </div>
                    <div className="mb-5">
                        <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-start">
                            <div className="mb-5 h-20 w-20 flex-none">
                                {/* Le texte alternatif etait « img ». */}
                                <Avatar className="mx-auto size-20">
                                    {user.image && (
                                        <Avatar.Image alt={[user.prenoms, user.nom].filter(Boolean).join(' ') || 'Photo de profil'} src={user.image} />
                                    )}
                                    <Avatar.Fallback>
                                        {(user.prenoms ?? user.nom)?.[0]?.toUpperCase() ?? '?'}
                                    </Avatar.Fallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col items-center text-center sm:items-start sm:px-4 sm:text-left">
                                <p className="text-xl font-semibold text-primary">{`${user.username}`}</p>
                                <p className="font-medium flex items-center gap-2">
                                    <IconShield size={16} /> Rôle : {user.role.libelle}
                                </p>
                            </div>
                        </div>
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
                    </div>
                </div>
                {peutDefinirCode && (
                    <div className="lg:col-span-1">
                        <CodeSecuriteCard username={user.username} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
