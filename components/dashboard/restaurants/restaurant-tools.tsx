'use client';

import { Restaurant } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import RestaurantValidate from './restaurant-validate';
import Link from 'next/link';

const RestaurantTools = ({ restaurant, validateBy = 'no-body' }: { restaurant: Restaurant; validateBy: 'auth' | 'ops' | 'no-body' }) => {
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
                    <DropdownItem as={Link} href={`/restaurants/${restaurant.id}`} key="details">
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

            <RestaurantValidate restaurant={restaurant} open={open} setOpen={setOpen} validateBy={validateBy} />
        </>
    );
};

export default RestaurantTools;
