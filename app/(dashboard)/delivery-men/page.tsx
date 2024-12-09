import Loading from '@/components/layouts/loading';
import { Metadata } from 'next';
import React, { Suspense } from 'react';
import DeliveryMenList from '@/components/dashboard/delivery-men/delivery-men-list';
import { getDeliveryMen } from '@/src/actions/delivery-men.actions';
export const metadata: Metadata = {
    title: 'Delivery Men',
};

export default async function DeliveryMen() {
    const deliveryMen = await getDeliveryMen();

    return (
        <Suspense fallback={<Loading />}>
            <DeliveryMenList deliveryMen={deliveryMen} validateBy="no-body" />
        </Suspense>
    );
}
