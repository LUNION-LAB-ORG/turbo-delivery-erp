'use client';

import { Collection } from '@/types/models';
import { Button, Dropdown } from '@heroui-v3/react';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import TypePlatEdit from './type-plats-edit';
import { useAbility } from '@/hooks/use-ability';

const TypePlatsTools = ({ typePlat }: { typePlat: Collection }) => {
    const [open, setOpen] = useState<boolean>(false);
    const ability = useAbility();
    const canUpdate = ability.can('manage', 'Menu');
    return (
      <>
        <Dropdown>
          <Button
            aria-label={`Actions sur ${typePlat.libelle ?? 'ce type de plat'}`}
            isIconOnly
            size="sm"
            variant="ghost"
          >
            <IconDotsVertical />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu aria-label="Actions">
              {canUpdate ? (
                <Dropdown.Item id="edit" onAction={() => setOpen(true)} textValue="Modifier">
                  Modifier
                </Dropdown.Item>
              ) : null}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
        <TypePlatEdit open={open} setOpen={setOpen} typePlat={typePlat} />
      </>
    );
};

export default TypePlatsTools;
