"use client"
import React from 'react';
import { Tabs, Tab} from '@heroui/react';
import {usePathname } from 'next/navigation';
import Link from 'next/link';
import SectionHeaderRetour from '@/components/commons/section-header-retour';


export default function SlotLayout({ children }: { children: React.ReactNode }) {

    const pathname = usePathname()

    const tabs: {
        id: string;
        href: string;
        label: string;
    }[] = [
        { id: '/delivery-men/performance', href: '/delivery-men/performance', label: 'Flotte de Turboys Bird' },
        { id: '/delivery-men/performance/turboys-assignes', href: '/delivery-men/performance/turboys-assignes', label: 'Flotte de Turboys Assignés' },
    ];

    
    return (
        <div>
            <SectionHeaderRetour text="Performance"/>
            <Tabs color="primary" variant="underlined" items={tabs} selectedKey={pathname == '/delivery-men/performance' ? '/delivery-men/performance' : pathname == '/delivery-men/performance/turboys-assignes'?'/delivery-men/performance/turboys-assignes':''} className="w-full">
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