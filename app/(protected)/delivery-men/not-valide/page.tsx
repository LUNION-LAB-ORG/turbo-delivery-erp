import { getDeliveryMenNoValidated } from '@/src/actions/delivery-men.actions';
import Content from './content';

export default async function DeliveryMen() {
    const deliveryMen = await getDeliveryMenNoValidated(0, 5);
    return (
        <Content initialData={deliveryMen} />
    );
}
