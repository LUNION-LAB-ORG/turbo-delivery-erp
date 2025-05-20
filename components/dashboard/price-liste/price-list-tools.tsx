'use client';

import { User } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@heroui/react";
import { useState } from 'react';
import { IconDotsVertical, IconTrash } from '@tabler/icons-react';
import PriceListeDelete from './price-liste-delete';

const PriceListeTools = ({ id }: { id:string}) => {
    const [open, setOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);
    return (
        <>
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="light" isIconOnly>
                            <IconTrash />
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                        <DropdownSection showDivider title="Actions">
                            <DropdownItem key="edit" onClick={() => setOpen(true)}>
                                Annuler
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownItem key="delete" className="text-danger" color="danger" onClick={() => setOpenDelete(true)}>
                            Suprimer
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
                
     
            <PriceListeDelete id={id} open={openDelete} setOpen={setOpenDelete} />
        </>
    );
};

export default PriceListeTools;
