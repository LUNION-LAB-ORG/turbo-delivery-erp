"use client"
import React from 'react';
import { Tabs, Tab } from '@heroui/react';
import {usePathname } from 'next/navigation';
import Link from 'next/link';
import SectionHeader from '@/components/dashboard/slot/sectionHeader';


export default function SlotLayout({ children }: { children: React.ReactNode }) {

    const pathname = usePathname()

    const tabs: {
        id: string;
        href: string;
        label: string;
    }[] = [
        { id: '/delivery-men/slot', href: '/delivery-men/slot', label: 'Flotte de Turboys Bird' },
        { id: '/delivery-men/slot/turboys-assignes', href: '/delivery-men/slot/turboys-assignes', label: 'Flotte de Turboys Assignés' },
    ];

    return (
        <div>
            <SectionHeader/>
            <Tabs color="primary" variant="underlined" items={tabs} selectedKey={pathname == '/delivery-men/slot' ? '/delivery-men/slot' : pathname == '/delivery-men/slot/turboys-assignes'?'/delivery-men/slot/turboys-assignes':''} className="w-full">
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