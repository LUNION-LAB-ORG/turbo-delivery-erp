'use client';

import React, { useState } from 'react';
import { User } from '@/types/models';
import { PaginatedResponse } from '@/types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import UsersAdd from './users-add';
import UsersTools from './users-tools';
import UsersEmailPrimaryToggle from './users-email-primary-toggle';
import { Avatar, Button, Card, Chip, SearchField } from '@heroui-v3/react';
import { LayoutGrid, List } from 'lucide-react';
import PaginationBlock from '@/components/pagination-block';
import { Can } from '@/components/auth/Can';
import { TableauResponsive, type ColonneResponsive } from '@/components/commons/TableauResponsive';

const PAR_PAGE = 10;

/** Les initiales tiennent lieu de portrait : deux lettres valent mieux qu'une. */
function initiales(user: User) {
  return `${user.nom?.[0] ?? ''}${user.prenoms?.[0] ?? ''}`.toUpperCase() || '?';
}

const UsersList = ({ users }: { users: PaginatedResponse<User> | null }) => {
  const [value, setValue] = useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  // Filtrer les utilisateurs selon la recherche
  const filteredItems =
    users?.content.filter(
      (user) =>
        user.nom.toLowerCase().includes(search.toLowerCase()) ||
        user.prenoms.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  // Calculer les informations de pagination pour les données filtrées
  const totalFilteredItems = filteredItems.length;
  const totalPages = Math.ceil(totalFilteredItems / PAR_PAGE);
  const startIndex = currentPage * PAR_PAGE;
  const endIndex = Math.min(startIndex + PAR_PAGE, totalFilteredItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Une recherche qui reduit la liste laissait l'ecran sur l'ancienne page : au-dela du
  // nouveau total, la page affichee etait VIDE et se lisait « aucun utilisateur ».
  const handleSearch = (v: string) => {
    setSearch(v);
    setCurrentPage(0);
  };

  const colonnes: readonly ColonneResponsive<User>[] = [
    {
      cle: 'nom',
      libelle: 'Nom',
      identite: true,
      rendu: (user) => (
        <div className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            <Avatar.Fallback>{initiales(user)}</Avatar.Fallback>
          </Avatar>
          <span className="truncate font-medium text-foreground">{`${user.nom} ${user.prenoms}`}</span>
        </div>
      ),
    },
    { cle: 'email', libelle: 'Email', rendu: (user) => user.email },
    { cle: 'username', libelle: "Nom d'utilisateur", rendu: (user) => user.username },
    { cle: 'role', libelle: 'Rôle', rendu: (user) => user.role.libelle },
    {
      cle: 'statut',
      libelle: 'Statut',
      /*
       * Un compte inactif n'est pas un AVERTISSEMENT : c'est une absence d'activite.
       * L'ambre y annoncait un probleme qui n'existe pas.
       */
      rendu: (user) => (
        <Chip color={user.status === 1 ? 'success' : 'default'} size="sm" variant="soft">
          <Chip.Label>{user.status === 1 ? 'Actif' : 'Inactif'}</Chip.Label>
        </Chip>
      ),
    },
    {
      cle: 'emailsNotif',
      libelle: 'Emails de notif',
      /*
       * 2026-05 : bascule « Recoit les emails de notifs ». Permet de designer 1-2
       * destinataires email primaires par role pour eviter de saturer le quota SMTP
       * Hostinger 50/h. L'in-app est toujours diffusee a tous les users du role.
       */
      rendu: (user) => <UsersEmailPrimaryToggle user={user} />,
    },
    {
      cle: 'actions',
      libelle: 'Actions',
      actions: true,
      rendu: (user) => <UsersTools user={user} value="list" />,
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/*
         * Le titre etait peint au ROUGE DE MARQUE. Un titre n'appelle aucun geste : la
         * couleur d'accent y disait quelque chose de faux, et la seule action de l'entete,
         * « Ajouter un utilisateur », la partageait avec lui.
         * « Page 1 sur 0 » s'affichait quand la recherche ne rendait rien : un total de
         * pages nul n'est pas une page.
         */}
        <h2 className="text-2xl font-bold text-foreground">
          Utilisateurs : {totalFilteredItems} (Page {currentPage + 1} sur {Math.max(totalPages, 1)})
        </h2>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex gap-3">
            <Can I="create" a="Utilisateur">
              <div>
                <UsersAdd />
              </div>
            </Can>
            {/*
             * Les deux bascules de vue etaient des `<button className="btn
             * btn-outline-primary">` du gabarit d'origine, avec un fond rouge de marque
             * pour dire « active » : deux boutons rouges a cote du bouton d'ajout, et
             * rien n'annoncait a un lecteur d'ecran laquelle des deux vues etait choisie.
             */}
            <Button
              aria-label="Vue en liste"
              aria-pressed={value === 'list'}
              isIconOnly
              onPress={() => setValue('list')}
              variant={value === 'list' ? 'secondary' : 'ghost'}
            >
              <List aria-hidden="true" className="size-4" />
            </Button>
            <Button
              aria-label="Vue en grille"
              aria-pressed={value === 'grid'}
              isIconOnly
              onPress={() => setValue('grid')}
              variant={value === 'grid' ? 'secondary' : 'ghost'}
            >
              <LayoutGrid aria-hidden="true" className="size-4" />
            </Button>
          </div>
          {/*
           * La loupe etait un `<button disabled>` pose en absolu sur le champ : un bouton
           * mort, que le lecteur d'ecran annoncait quand meme. Ici c'est l'icone du champ
           * de recherche, et la croix rend la liste complete en un geste.
           */}
          <SearchField onChange={handleSearch} value={search}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input
                aria-label="Rechercher des utilisateurs"
                placeholder="Rechercher des utilisateurs"
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>
      </div>

      {value === 'list' && (
        <div className="mt-5">
          <TableauResponsive
            cleLigne={(user) => user.id}
            colonnes={colonnes}
            libelle="Utilisateurs"
            lignes={paginatedItems}
            vide={search ? 'Aucun utilisateur ne correspond à cette recherche' : 'Aucun utilisateur'}
          />
        </div>
      )}

      {value === 'grid' && (
        <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {paginatedItems.length === 0 ? (
            <p className="col-span-full py-10 text-center text-sm text-muted">
              {search ? 'Aucun utilisateur ne correspond à cette recherche' : 'Aucun utilisateur'}
            </p>
          ) : (
            /*
             * La carte etait deux div IDENTIQUES imbriquees (meme classe, meme ombre),
             * surmontees d'une image de fond decorative du gabarit. `UsersTools` pose ses
             * gestes en absolu au bas de la carte : la position relative et la reserve de
             * hauteur sous le contenu restent donc necessaires.
             */
            paginatedItems.map((user: User) => (
              <Card className="relative overflow-hidden" key={user.id}>
                <Card.Content className="items-center gap-1 p-6 pb-24 text-center">
                  <Avatar size="lg">
                    <Avatar.Fallback>{initiales(user)}</Avatar.Fallback>
                  </Avatar>
                  <p className="mt-3 text-lg font-semibold text-foreground">{`${user.nom} ${user.prenoms}`}</p>
                  <p className="text-sm text-muted">{user.role.libelle}</p>
                  <div className="mt-1">
                    <Chip color={user.status === 1 ? 'success' : 'default'} size="sm" variant="soft">
                      <Chip.Label>{user.status === 1 ? 'Actif' : 'Inactif'}</Chip.Label>
                    </Chip>
                  </div>

                  <dl className="mt-5 flex w-full flex-col gap-2 text-left">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-xs text-muted">Email</dt>
                      <dd className="min-w-0 break-all text-right text-sm text-foreground">{user.email}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-xs text-muted">Nom d&apos;utilisateur</dt>
                      <dd className="min-w-0 truncate text-right text-sm text-foreground">{user.username}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-xs text-muted">Département</dt>
                      <dd className="min-w-0 truncate text-right text-sm text-foreground">{user.departement || '-'}</dd>
                    </div>
                    {/* Un salaire se compare a celui d'a cote : chasse tabulaire, a droite. */}
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-xs text-muted">Salaire</dt>
                      <dd className="text-right text-sm tabular-nums text-foreground">
                        {user.salaire ? formatCFA(user.salaire) : '-'}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-xs text-muted">Date d&apos;entrée</dt>
                      <dd className="text-right text-sm tabular-nums text-foreground">
                        {user.dateEntree ? new Date(user.dateEntree).toLocaleDateString('fr-FR') : '-'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="shrink-0 text-xs text-muted">Emails de notif</dt>
                      <dd>
                        <UsersEmailPrimaryToggle user={user} />
                      </dd>
                    </div>
                  </dl>
                </Card.Content>
                <UsersTools user={user} value="grid" />
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <PaginationBlock currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  );
};

export default UsersList;
