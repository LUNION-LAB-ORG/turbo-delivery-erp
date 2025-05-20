import UsersList from '@/components/dashboard/users/users-list';
import { getUsers } from '@/src/actions/users.actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Utilisateurs',
};

export default async function Users() {
    const users = await getUsers();
    
    return (
        <UsersList users={users} />

    );
}
