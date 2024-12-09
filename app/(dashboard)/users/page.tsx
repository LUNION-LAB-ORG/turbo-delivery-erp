import UsersList from '@/components/dashboard/users/users-list';
import Loading from '@/components/layouts/loading';
import { getUsers } from '@/src/actions/users.actions';
import { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Utilisateurs',
};

export default async function Users() {
    const users = await getUsers();
    console.log(users);
    return (
        <Suspense fallback={<Loading />}>
            <UsersList users={users} />
        </Suspense>
    );
}
