'use client';

import { Button, Dropdown } from '@heroui-v3/react';
import { CalendarRange, Map, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

/**
 * Menu d'actions sur un livreur, depuis la liste de performance.
 *
 * <p>Le déclencheur était une icône « lignes empilées » posée dans un `<span>` : ni
 * atteignable au clavier, ni annonçable, et le pictogramme évoquait une liste plutôt
 * qu'un menu. C'est un bouton nommé, aux trois points, comme partout ailleurs.</p>
 *
 * <p>Une troisième entrée « Modifier ses identifications » était en commentaire depuis
 * assez longtemps pour que sa route ait changé de sens : elle pointait vers l'écran des
 * créneaux. Elle n'est pas reconduite.</p>
 */
export default function DropDownActionPerformance({ id }: { id: string }) {
  const router = useRouter();

  return (
    <Dropdown>
      <Button aria-label="Actions sur ce livreur" isIconOnly size="sm" variant="ghost">
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="Actions sur ce livreur">
          <Dropdown.Item
            id="carte"
            onAction={() => router.push(`/trafic?turboysId=${id}`)}
            textValue="Voir la position sur la carte"
          >
            <Map aria-hidden="true" className="size-4" />
            Voir la position sur la carte
          </Dropdown.Item>
          <Dropdown.Item
            id="creneaux"
            onAction={() => router.push(`/delivery-men/performance-apercue/${id}`)}
            textValue="Afficher les créneaux"
          >
            <CalendarRange aria-hidden="true" className="size-4" />
            Afficher les créneaux
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
