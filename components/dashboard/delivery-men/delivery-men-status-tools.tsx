'use client';

import { LivreurStatutVM } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import Link from 'next/link';
import DeliveryMenStatusValidate from './delivery-men-status-validate';

const DeliveryMenStatusTools = ({ deliveryMan, validateBy }: { deliveryMan: LivreurStatutVM | null; validateBy: 'auth' | 'ops' | 'no-body' }) => {
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
                    <DropdownItem as={Link} href={`/delivery-men/${deliveryMan && deliveryMan.livreurId}`} key="details">
                        Détails
                    </DropdownItem>
                    {validateBy === "auth" ?
                        <DropdownItem key="edit" onClick={() => setOpen(true)}>
                            Valider
                        </DropdownItem>
                        :
                        validateBy === "ops" ?
                            <DropdownItem key="edit" onClick={() => setOpen(true)}>
                                Activer
                            </DropdownItem>
                            :
                            <></>
                    }
                </DropdownMenu>
            </Dropdown>
            {
                deliveryMan && <DeliveryMenStatusValidate deliveryMan={deliveryMan} open={open} setOpen={setOpen} validateBy={validateBy} />
            }

        </>
    );
};

export default DeliveryMenStatusTools;
