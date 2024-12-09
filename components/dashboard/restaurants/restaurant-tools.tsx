'use client';

import { Restaurant } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from '@nextui-org/react';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import RestaurantValidate from './restaurant-validate';

const RestaurantTools = ({ restaurant, value, validateBy = 'no-body' }: { restaurant: Restaurant; value: 'list' | 'grid'; validateBy: 'auth' | 'ops' | 'no-body' }) => {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <>
            {value === 'list' && (
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="light" isIconOnly>
                            <IconDotsVertical />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                        <DropdownSection showDivider title="Actions">
                            {validateBy !== 'no-body' ? (
                                <DropdownItem key="edit" onClick={() => setOpen(true)}>
                                    Valider
                                </DropdownItem>
                            ) : (
                                <></>
                            )}
                        </DropdownSection>
                    </DropdownMenu>
                </Dropdown>
            )}

            {value === 'grid' && (
                <div className="absolute bottom-0 mt-6 flex w-full gap-4 p-6 ltr:left-0 rtl:right-0">
                    {validateBy !== 'no-body' && (
                        <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-outline-primary w-1/2">
                            Valider
                        </button>
                    )}
                </div>
            )}

            <RestaurantValidate restaurant={restaurant} open={open} setOpen={setOpen} validateBy={validateBy} />
        </>
    );
};

export default RestaurantTools;
