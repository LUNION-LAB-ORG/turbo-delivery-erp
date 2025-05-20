"use client"
import React, { useState } from 'react';
import { Tabs, Tab, Card, CardBody } from '@heroui/react';
import HeaderList from '../../../../components/dashboard/price-liste/header';
import {usePathname } from 'next/navigation';
import Link from 'next/link';
import SectionHeader from '@/components/dashboard/slot/sectionHeader';
import { IconList, IconMist } from '@tabler/icons-react';
import SectionHeaderRetour from '@/components/commons/section-header-retour';

{/* <IconList stroke={2} /> */}


export default function SlotLayout({ children }: { children: React.ReactNode }) {

    const [model,setModel]=useState(true)

    const pathname = usePathname()

    const tabs: {
        id: string;
        href: string;
        label: string;
    }[] = [
        { id: '/delivery-men/performance', href: '/delivery-men/performance', label: 'Flotte de Turboys Bird' },
        { id: '/delivery-men/performance/turboys-assignes', href: '/delivery-men/performance/turboys-assignes', label: 'Flotte de Turboys Assignés' },
    ];


    const toggelModel = ()=>{
        setModel((prev)=>!prev)
    }
    
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