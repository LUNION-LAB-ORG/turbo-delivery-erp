'use client';

import { DeliveryMan } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from '@heroui/react';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import DeliveryMenValidate from './delivery-men-validate';
import Link from 'next/link';

const DeliveryMenTools = ({ deliveryMan, validateBy }: { deliveryMan: DeliveryMan; validateBy: 'auth' | 'ops' | 'no-body' }) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="light" isIconOnly>
                        <IconDotsVertical />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                    <DropdownItem as={Link} href={`/delivery-men/${deliveryMan.id}`} key="details">
                        Détails
                    </DropdownItem>

                    {validateBy !== 'no-body' ? (
                        <DropdownItem key="edit" onClick={() => setOpen(true)}>
                            Valider
                        </DropdownItem>
                    ) : (
                        <></>
                    )}
                </DropdownMenu>
            </Dropdown>
            <DeliveryMenValidate deliveryMan={deliveryMan} open={open} setOpen={setOpen} validateBy={validateBy} />
        </>
    );
};

export default DeliveryMenTools;
