import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Delivery Men',
};

export default function DeliveryMenGlobalLayout({ children }: { children: React.ReactNode }) {

    return (
        <>{children}</>
    );
}
