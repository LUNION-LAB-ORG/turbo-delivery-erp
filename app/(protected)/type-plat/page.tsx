import TypePlatsList from '@/components/dashboard/type-plat/type-plats-list';
import { getTypePlats } from '@/src/actions/type-plats.actions';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Type de plats',
};

export default async function TypePlats() {
    const typePlats = await getTypePlats();
   
    return (
        <TypePlatsList typePlats={typePlats} />

    );
}
