'use client';

import { User } from '@/types/models';
import UsersEdit from './users-edit';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@heroui/react";
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import UsersDeleteRestaure from './users-delete-restaure';
import UsersDisableEnable from './users-disable-enable';

const UsersTools = ({ user, value }: { user: User; value: 'list' | 'grid' }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const [openDisableEnable, setOpenDisableEnable] = useState<boolean>(false);
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
                            <DropdownItem key="edit" onClick={() => setOpen(true)}>
                                Modifier
                            </DropdownItem>
                            <DropdownItem key="disableEnable" className="text-danger" color="danger" onClick={() => setOpenDisableEnable(true)}>
                                {user.status ? 'Désactiver' : 'Activer'}
                            </DropdownItem>
                        </DropdownSection>
                        <DropdownItem key="delete" className="text-danger" color="danger" onClick={() => setOpenDelete(true)}>
                            {user.deleted ? 'Restaurer' : 'Supprimer'}
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            )}

            {value === 'grid' && (
                <div className="absolute bottom-0 mt-6 flex w-full gap-4 p-6 ltr:left-0 rtl:right-0">
                    <button type="button" onClick={() => setOpenDelete(true)} className="btn btn-sm btn-outline-danger w-1/2">
                        {user.deleted ? 'Restaurer' : 'Supprimer'}
                    </button>
                    <button type="button" onClick={() => setOpenDisableEnable(true)} className="btn btn-sm btn-outline-danger w-1/2">
                        {user.status === 1 ? 'Désactiver' : 'Activer'}
                    </button>
                    <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-outline-primary w-1/2">
                        Modifier
                    </button>
                </div>
            )}

            <UsersEdit user={user} open={open} setOpen={setOpen} />
            <UsersDeleteRestaure user={user} open={openDelete} setOpen={setOpenDelete} />
            <UsersDisableEnable user={user} open={openDisableEnable} setOpen={setOpenDisableEnable} />
        </>
    );
};

export default UsersTools;
