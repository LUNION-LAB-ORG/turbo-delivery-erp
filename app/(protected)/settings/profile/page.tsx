import UserProfile from '@/components/dashboard/settings/profile/profile';
import { getProfile } from '@/src/actions/users.actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Utilisateurs',
};

export default async function Users() {
    const user = await getProfile();
    if (!user) return null;
    return (
        <UserProfile user={user} />

    );
}
