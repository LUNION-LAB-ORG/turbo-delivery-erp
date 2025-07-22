'use client';

import { title } from '@/components/primitives';
import { Tab, Tabs } from '@heroui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DeliveryMenLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const tabs: {
        id: string;
        href: string;
        label: string;
    }[] = [
            { id: '/delivery-men', href: '/delivery-men', label: 'Tous' },
            { id: '/delivery-men/assigned', href: '/delivery-men/assigned', label: 'Assignés' },
            { id: '/delivery-men/birds', href: '/delivery-men/birds', label: 'Birds' },
            { id: '/delivery-men/requests', href: '/delivery-men/requests', label: 'Demandes d\'identification' },
        ];
    const currentTab = tabs.find((tab) => pathname.startsWith(tab.id) && tab.id !== '/delivery-men');

    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Coursiers</h1>
            </div>
            <Tabs color="primary" variant="underlined" items={tabs} selectedKey={pathname == '/delivery-men' ? '/delivery-men' : currentTab ? currentTab.id : ''} className="w-full">
                {(item) => {
                    return (
                        <Tab key={item.id} as={Link} href={item.href} title={item.label}>
                            {children}
                        </Tab>
                    );  
                }}
            </Tabs>
        </div>
    );
}
