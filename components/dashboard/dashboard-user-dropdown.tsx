'use client';

import { signOut } from '@/src/actions/users.actions';
import { Avatar, Button, Dropdown } from '@heroui-v3/react';
import { User } from '@/types/models';
import { useRouter } from 'next/navigation';

export const DashboardUserDropdown = ({ profile }: { profile: User }) => {
  const router = useRouter();
  const nom = profile.username ?? '';

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* Nom masque sur mobile pour ne pas chevaucher l'icone de notification ; il reste
          lisible dans le menu, ou il titre l'entree « Mon compte ». */}
      <span className="hidden sm:inline max-w-[160px] truncate text-sm font-semibold uppercase text-foreground">
        {nom}
      </span>
      {/*
       * `Dropdown.Trigger` rend son PROPRE bouton : le `Button` est enfant DIRECT du
       * `Dropdown`, sans quoi on obtient un bouton dans un bouton. Le declencheur n'avait
       * par ailleurs aucun nom accessible : un avatar muet ouvrant deux gestes.
       */}
      <Dropdown>
        <Button
          aria-label={nom ? `Menu de ${nom}` : 'Menu du compte'}
          className="rounded-full"
          isIconOnly
          size="sm"
          variant="secondary"
        >
          <Avatar size="sm">
            <Avatar.Image alt="" src={profile.image ?? ''} />
            <Avatar.Fallback>{(nom || '?').slice(0, 2).toUpperCase()}</Avatar.Fallback>
          </Avatar>
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu aria-label="Compte">
            {/*
             * « Mon compte » etait un LIBELLE de section portant un `onClick`. Un libelle
             * n'est ni focalisable ni activable au clavier : le geste n'existait qu'a la
             * souris. C'est une entree de menu.
             */}
            <Dropdown.Item
              id="compte"
              onAction={() => router.push('/settings/profile')}
              textValue="Mon compte"
            >
              <span className="flex flex-col">
                <span className="text-sm font-medium">Mon compte</span>
                {nom && <span className="text-xs text-muted">{nom}</span>}
              </span>
            </Dropdown.Item>
            <Dropdown.Item
              id="deconnexion"
              onAction={async () => {
                await signOut();
              }}
              textValue="Déconnexion"
            >
              Déconnexion
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
};
