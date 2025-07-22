import { Metadata } from 'next';
import Content from './content';
import { getDeliveryDetail } from '@/src/actions/delivery-men.actions';

export const metadata: Metadata = {
    title: 'Delievry Man',
};

export default async function DeliveryManPage({ params }: { params: { driver_id: string } }) {
    const driver = await getDeliveryDetail(params.driver_id ?? "");
    return (
        <Content driver={driver} />
    );
}
