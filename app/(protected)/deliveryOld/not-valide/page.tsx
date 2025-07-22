import { getDeliveryMenNoValidated } from '@/src/actions/delivery-men.actions';
import { Metadata } from 'next';
import Content from './content';
export const metadata: Metadata = {
    title: 'Delivery Men',
};

export default async function DeliveryMen() {
    const deliveryMen = await getDeliveryMenNoValidated(0, 5);
    return (
        <Content initialData={deliveryMen} />
    );
}
