"use client"
import React from 'react';
import { Tabs, Tab, Card, CardBody } from '@heroui/react';
import HeaderList from '../../../../components/dashboard/price-liste/header';
import {usePathname } from 'next/navigation';
import Link from 'next/link';
import SectionHeader from '@/components/dashboard/slot/sectionHeader';
import HeaderCreneau from '@/components/dashboard/delivery-men/ceneau/header-creneau';

export default function SlotLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const tabs: {
        id: string;
        href: string;
        label: string;
    }[] = [
        { id: '/delivery-men/creneau-progression', href: '/delivery-men/creneau-progression', label: 'Flotte performance de Turboys Bird' },
        { id: '/delivery-men/creneau-progression/turboys-assignes', href: '/delivery-men/creneau-progression/turboys-assignes', label: 'Flotte performance de Turboys Assignés' },
    ];
    
    return (
        <div>
            <HeaderCreneau/>
            {/* <HeaderList initialData={initialData}/> */}
            <Tabs color="primary" variant="underlined" items={tabs} selectedKey={pathname == '/delivery-men/creneau-progression'?'/delivery-men/creneau-progression':pathname == '/delivery-men/creneau-progression/turboys-assignes'?'/delivery-men/creneau-progression/turboys-assignes':''} className="w-full">
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