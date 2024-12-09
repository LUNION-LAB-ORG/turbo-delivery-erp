import Loading from '@/components/layouts/loading';
import React, { Suspense } from 'react';

export default async function Page() {
    return (
        <Suspense fallback={<Loading />}>
            <div>Dashboard</div>
        </Suspense>
    );
}
