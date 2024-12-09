'use client';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { signOut } from '@/src/actions/users.actions';
import { title } from '../primitives';
import { Avatar } from '@nextui-org/react';
import { User } from '@/types/models';
import { useRouter } from 'next/navigation';

export const DashboardUserDropdown = ({ profile }: { profile: User }) => {
    const router = useRouter();
    return (
        <div className="flex items-center gap-2">
            <span className={title({ size: 'h4', class: 'uppercase' })}>{profile.username ?? ''}</span>
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <div>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <Avatar size="sm" src={profile.image ?? ''} alt="Logo Restaurant" />
                        </Button>
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-sm font-medium" onClick={() => router.push('/settings/profile')}>
                        Mon compte
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* <DropdownMenuItem>Paramètres</DropdownMenuItem>
                    <DropdownMenuItem>Support</DropdownMenuItem> */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={async () => {
                            await signOut();
                        }}
                    >
                        Déconnexion
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
