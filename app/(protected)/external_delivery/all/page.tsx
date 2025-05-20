import Content from './content';
import Loading from '@/components/layouts/loading';
import { getPaginationCourseExterneAutreStatus } from '@/src/actions/courses.actions';
import { getLivreursDisponible } from '@/src/actions/delivery-men.actions';

export default async function DeliveryPage() {
    const data = await getPaginationCourseExterneAutreStatus(0, 5);
    const delivers = await getLivreursDisponible() ?? [];

    if(!data) return <Loading/>
    
    return (
        <Content initialData={data} delivers={delivers} />
    );
}
