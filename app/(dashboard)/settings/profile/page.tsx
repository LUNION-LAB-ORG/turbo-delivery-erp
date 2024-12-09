import UserProfile from '@/components/dashboard/settings/profile/profile';
import Loading from '@/components/layouts/loading';
import { getProfile } from '@/src/actions/users.actions';
import { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Utilisateurs',
};

export default async function Users() {
    const user = await getProfile();
    if (!user) return null;
    return (
        <Suspense fallback={<Loading />}>
            <UserProfile user={user} />
        </Suspense>
    );
}
