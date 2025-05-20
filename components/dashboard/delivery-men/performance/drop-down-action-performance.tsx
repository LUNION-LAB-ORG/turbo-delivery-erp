'use client'

import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
    Button,
    cn,
  } from "@heroui/react";
import { IconMap, IconUser } from "@tabler/icons-react";
import { AlignJustify } from "lucide-react";
  


  export default function DropDownActionPerformance({id}:{id:string}) {
    const iconClasses = "text-xl text-default-500 pointer-events-none flex-shrink-0";
  
    return (
      <Dropdown>
        <DropdownTrigger>
            <span className="cursor-pointer">
              <AlignJustify/>
             </span>
            
          {/* <Button >...</Button> */}
        </DropdownTrigger>
        <DropdownMenu aria-label="Dropdown menu with description" variant="faded">
          <DropdownSection showDivider title="Actions">
            <DropdownItem
              key="carte"
              href={`/trafic?turboysId=${id}`}
              description="position sur la carte du livreur"
              startContent={<IconMap className={iconClasses} />}
            
            >
              Voir la position sur la carte
            </DropdownItem>
            <DropdownItem
              key="performance-details"
              href={`/delivery-men/performance-apercue/${id}`}
              description="voir les details"
              startContent={<IconUser className={iconClasses} />}
            >
             Afficher les créneaux
            </DropdownItem>
            {/* <DropdownItem
              key="performance-details"
              href={`/delivery-men/creneau-progressionById/${id}`}
              description="voir les details"
              startContent={<IconUser className={iconClasses} />}
            >
             Modifier ses identifications
            </DropdownItem> */}
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
    );
  }
  