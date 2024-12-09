'use client';

import React, { useState } from 'react';
import { Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownSection, DropdownTrigger } from '@nextui-org/react';
import Link from 'next/link';
import { IconCalendar, IconHeart, IconHelpCircle, IconLogout, IconMessageCircle2, IconSettings, IconHome } from '@tabler/icons-react';
import Image from 'next/image';

import ThemeSwitch from '../layouts/themeSwitch';
import { useSession } from 'next-auth/react';
import { signOut } from '@/src/actions/users.actions';

export default function UserProfileDropdown() {
    const [pending, setPending] = useState(false);
    const { data: session } = useSession();

    return (
        <>
            {session?.user ? (
                <Dropdown
                    classNames={{
                        base: 'before:bg-default-200', // change arrow background
                        content: 'py-1 px-1 border border-default-200 bg-gradient-to-br from-white to-default-200 dark:from-default-50 dark:to-black',
                    }}
                >
                    <DropdownTrigger>
                        <Avatar
                            isBordered
                            showFallback
                            as="button"
                            className="transition-transform"
                            color="primary"
                            name={session.user?.name?.split(' ')[0].slice(0, 1)?.toUpperCase() + '' + session.user?.name?.split(' ')[1]?.slice(0, 1).toUpperCase()}
                            size="sm"
                            src={session.user?.image!}
                        />
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Profile Actions" variant="flat">
                        <DropdownItem key="profile" variant="light">
                            <div className="flex flex-col gap-2 p-1">
                                <div className="flex gap-2 items-center">
                                    <Avatar
                                        showFallback
                                        as="button"
                                        className="transition-transform"
                                        name={session.user?.name?.split(' ')[0].slice(0, 1)?.toUpperCase() + '' + session.user?.name?.split(' ')[1]?.slice(0, 1).toUpperCase()}
                                        size="sm"
                                        src={session.user?.image!}
                                    />
                                    <div>
                                        <p className="font-semibold text-sm">{session.user?.name}</p>
                                        <p className="text-xs">{session.user?.email}</p>
                                    </div>
                                    {/* <ThemeSwitch className="p-1 border border-dashed border-gray-600 dark:border-primary rounded-full absolute top-0 right-0" size="sm" /> */}
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button as={Link} href="/settings" size="sm" startContent={<IconSettings size={16} />} variant="ghost">
                                        Paramètres
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        startContent={<IconLogout size={16} />}
                                        variant="ghost"
                                        onClick={async () => {
                                            setPending(true);
                                            await signOut();
                                            setPending(false);
                                        }}
                                    >
                                        Déconnexion
                                    </Button>
                                </div>
                            </div>
                        </DropdownItem>
                        <DropdownSection showDivider title={'Mode voyageur'}>
                            <DropdownItem key="home" as={Link} href="/" startContent={<IconHome size={16} />}>
                                Accueil
                            </DropdownItem>
                            <DropdownItem key="favorite" startContent={<IconHeart size={16} />}>
                                Mes favoris
                            </DropdownItem>
                            <DropdownItem key="message" startContent={<IconMessageCircle2 size={16} />}>
                                Message
                            </DropdownItem>
                            <DropdownItem key="booking" startContent={<IconCalendar size={16} />}>
                                Réservation
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection showDivider title={'Mode hôte'}>
                            <DropdownItem
                                key="workspaces"
                                as={Link}
                                href="/workspaces"
                                startContent={<Image alt="workspaces" height={18} src={'/assets/images/illustrations/workspace.png'} width={18} />}
                            >
                                Espace de travail
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownSection title={'Aides et sécurité'}>
                            <DropdownItem key="help_and_feedback" startContent={<IconHelpCircle size={16} />}>
                                Aide & Feedback
                            </DropdownItem>
                        </DropdownSection>
                    </DropdownMenu>
                </Dropdown>
            ) : (
                <Button as={Link} color="primary" href={'/auth'} isLoading={pending} onClick={() => setPending(true)}>
                    Connexion
                </Button>
            )}
        </>
    );
}
