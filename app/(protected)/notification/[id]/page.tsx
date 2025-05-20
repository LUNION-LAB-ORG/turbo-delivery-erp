import { Suspense } from 'react';
import Loading from '@/components/layouts/loading';
import { DetailNotification } from './content';
import { fetchDetailNotifcation } from '@/src/actions/notifcation.action';

export default async function Page({ params }: { params: { id: string } }) {
    const notifcationDetail = await fetchDetailNotifcation(params.id ?? '');
    return (
        <Suspense fallback={<Loading />}>
            <DetailNotification detailNotification={notifcationDetail} />
        </Suspense>
    );
}
