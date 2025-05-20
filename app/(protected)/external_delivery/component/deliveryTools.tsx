'use client';

import { CourseExterne, LivreurDisponible, Restaurant } from '@/types/models';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Button } from "@heroui/react";
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import { COURSES_STATUSES } from '@/data';
import DeliveryAssign from './delivery-assign';
import { TbTruckDelivery } from 'react-icons/tb';

const DeliveryTools = ({ delivery, delivers }: { delivery: CourseExterne; delivers: LivreurDisponible[] }) => {
    const [openAssign, setOpenAssign] = useState<boolean>(false);

    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button variant="light" isIconOnly>
                        <IconDotsVertical />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                    <DropdownSection showDivider title="Actions">
                        {/* {delivery.statut === COURSES_STATUSES.EN_ATTENTE ? ( */}
                            <DropdownItem startContent={<TbTruckDelivery />} color="danger" key="edit" onClick={() => setOpenAssign(true)}>
                                Assigner la course
                            </DropdownItem>
                        {/* ) : (
                            <></>
                        )} */}
                    </DropdownSection>
                </DropdownMenu>
            </Dropdown>

            <DeliveryAssign delivery={delivery} delivers={delivers} open={openAssign} setOpen={setOpenAssign} />
        </>
    );
};

export default DeliveryTools;
