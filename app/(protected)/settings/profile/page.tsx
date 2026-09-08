import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import UserProfile from '@/components/dashboard/settings/profile/profile';
import { getProfile } from '@/src/actions/users.actions';

/*
 * Le titre d'onglet annoncait « Utilisateurs » : c'est le nom de l'ecran
 * d'ADMINISTRATION des comptes, pas celui-ci. Le menu, lui, dit « Parametres ».
 */
export const metadata: Metadata = {
    title: 'Paramètres',
};

export default async function PageParametres() {
    const user = await getProfile();
    if (!user) redirect('/auth');
    return <UserProfile user={user} />;
}
