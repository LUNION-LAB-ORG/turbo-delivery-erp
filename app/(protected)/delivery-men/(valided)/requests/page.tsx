import React, { Suspense } from 'react';
import { getAllDemandeAssignations } from '@/src/actions/delivery-men.actions';
import Content from './content';
import Loading from '@/app/loading';
import { allRestaurants } from '@/src/restaurants/restaurants.actions';

export default async function DeliveryMen() {
    const demandeAssignations = await getAllDemandeAssignations();
    const allRestaurant = await allRestaurants();
    return (
        <Suspense fallback={<Loading />}>
            <Content demandeAssignations={demandeAssignations} allRestaurant={allRestaurant} />
        </Suspense>
    );
}
