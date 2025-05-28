import React, { Suspense } from 'react';
import Loading from '@/components/layouts/loading';
import RestaurantContent from './content';
import { fetchStatistiqueFilleAttente } from '@/src/actions/file-attente.actions';

export default async function Page() {
    const statistiqueFileAttentes = await fetchStatistiqueFilleAttente()
    return (
        <Suspense fallback={<Loading />}>
            <RestaurantContent statistiqueFileAttentes={statistiqueFileAttentes} />
        </Suspense>
    );
}
