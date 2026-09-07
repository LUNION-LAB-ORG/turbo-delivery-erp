'use client';

import { Button, Dropdown } from '@heroui-v3/react';
import { Map, User, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

/**
 * Menu d'actions sur un livreur, depuis les listes de créneaux.
 *
 * <p>Le déclencheur était un `<span>` contenant les trois points en toutes lettres :
 * ni atteignable au clavier, ni annonçable — un lecteur d'écran lisait « puce puce
 * puce ». C'est maintenant un bouton nommé.</p>
 *
 * <p>Chaque entrée portait une « description » qui répétait son libellé : « Voir
 * profile » décrit par « Voir Profile ». Rien n'y était dit que le libellé ne disait
 * déjà. Elles sont retirées, la section « Actions » aussi : elle intitulait la
 * totalité du menu, ce que fait déjà son nom accessible.</p>
 */
export default function DropDownAction({ id }: { id: string }) {
  const router = useRouter();

  return (
    <Dropdown>
      <Button aria-label="Actions sur ce livreur" isIconOnly size="sm" variant="ghost">
        <User aria-hidden="true" className="size-4" />
      </Button>
      <Dropdown.Popover placement="bottom end">
        <Dropdown.Menu aria-label="Actions sur ce livreur">
          <Dropdown.Item
            id="profil"
            onAction={() => router.push(`/delivery-men/profil/${id}`)}
            textValue="Voir le profil"
          >
            <UserCircle aria-hidden="true" className="size-4" />
            Voir le profil
          </Dropdown.Item>
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
            onAction={() => router.push(`/delivery-men/creneau-progressionById/${id}`)}
            textValue="Afficher les créneaux"
          >
            <User aria-hidden="true" className="size-4" />
            Afficher les créneaux
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
