import Content from './content';
import { getTraficLivreurs } from '@/src/actions/trafic.actions';

export default async function Page() {
    const data = (await getTraficLivreurs()) ?? [];
    return (
        <Content data={data} />

    );
}
