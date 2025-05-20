"use client"
import React, { useState } from 'react';
import { Tabs, Tab, Card, CardBody } from '@heroui/react';
import HeaderList from '../../../../components/dashboard/price-liste/header';
import {usePathname } from 'next/navigation';
import Link from 'next/link';
import SectionHeader from '@/components/dashboard/slot/sectionHeader';
import { IconList, IconMist } from '@tabler/icons-react';

{/* <IconList stroke={2} /> */}


export default function SlotLayout({ children }: { children: React.ReactNode }) {

    const [model,setModel]=useState(true)

    const pathname = usePathname()

    const tabs: {
        id: string;
        href: string;
        label: string;
    }[] = [
        { id: '/delivery-men/slot', href: '/delivery-men/slot', label: 'Flotte de Turboys Bird' },
        { id: '/delivery-men/slot/turboys-assignes', href: '/delivery-men/slot/turboys-assignes', label: 'Flotte de Turboys Assignés' },
    ];


    const toggelModel = ()=>{
        setModel((prev)=>!prev)
    }
    
    return (
        <div>
            <SectionHeader/>
            {/* <HeaderList initialData={initialData}/> */}
            {/* <div className='absolute right-24 -ttsop-4'>
               <button onClick={toggelModel}>
                {
                    model? <IconList stroke={2} />:<IconMist/>
                 
                }
               </button>
            </div> */}
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