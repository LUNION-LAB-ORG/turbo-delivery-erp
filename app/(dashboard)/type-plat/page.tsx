import TypePlatsList from '@/components/dashboard/type-plat/type-plats-list';
import Loading from '@/components/layouts/loading';
import { getTypePlats } from '@/src/actions/type-plats.actions';
import { Metadata } from 'next';
import React, { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Type de plats',
};

export default async function TypePlats() {
    const typePlats = await getTypePlats();
    return (
        <Suspense fallback={<Loading />}>
            <TypePlatsList typePlats={typePlats} />
        </Suspense>
    );
}
