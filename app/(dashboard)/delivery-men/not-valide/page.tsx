import Loading from '@/components/layouts/loading';
import { getDeliveryMenNoValidated } from '@/src/actions/delivery-men.actions';
import { Metadata } from 'next';
import React, { Suspense } from 'react';
import DeliveryMenList from '@/components/dashboard/delivery-men/delivery-men-list';
export const metadata: Metadata = {
    title: 'Delivery Men',
};

export default async function DeliveryMen() {
    const deliveryMen = await getDeliveryMenNoValidated();
    return (
        <Suspense fallback={<Loading />}>
            <DeliveryMenList deliveryMen={deliveryMen} validateBy="auth" />
        </Suspense>
    );
}
