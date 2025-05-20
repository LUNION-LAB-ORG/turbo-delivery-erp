
import Content from './content';
import { Suspense } from 'react';
import Loading from '@/app/loading';
import { auth } from '@/auth';

export async function Notifications({ className }: { className?: string }) {
    return (
        <Suspense fallback={<Loading />}>
            <Content />
        </Suspense>
    );
};

export default Notifications;
