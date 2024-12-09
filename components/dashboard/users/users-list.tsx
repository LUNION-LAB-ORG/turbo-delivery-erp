'use client';

import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconListCheck from '@/components/icon/icon-list-check';
import IconSearch from '@/components/icon/icon-search';
import React, { useState } from 'react';
import { User } from '@/types/models';
import { PaginatedResponse } from '@/types/index';

import UsersAdd from './users-add';
import UsersTools from './users-tools';
import { Chip } from '@nextui-org/react';

const UsersList = ({ users }: { users: PaginatedResponse<User> | null }) => {
    const [value, setValue] = useState<'list' | 'grid'>('list');

    const [search, setSearch] = useState<string>('');

    const filteredItems = users?.content.filter((user) => user.nom.toLowerCase().includes(search.toLowerCase()) || user.prenoms.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">Utilisateurs : {filteredItems.length}</h2>
                <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex gap-3">
                        <div>
                            <UsersAdd />
                        </div>
                        <div>
                            <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                                <IconListCheck />
                            </button>
                        </div>
                        <div>
                            <button type="button" className={`btn btn-outline-primary p-2 ${value === 'grid' && 'bg-primary text-white'}`} onClick={() => setValue('grid')}>
                                <IconLayoutGrid />
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Rechercher des utilisateurs" className="peer form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button type="button" className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]">
                            <IconSearch className="mx-auto" />
                        </button>
                    </div>
                </div>
            </div>
            {value === 'list' && (
                <div className="panel mt-5 overflow-hidden border-0 p-0">
                    <div className="table-responsive">
                        <table className="table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Email</th>
                                    <th>Nom d&apos;utilisateur</th>
                                    <th>Rôle</th>
                                    <th>Statut</th>
                                    <th className="!text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((user: User) => {
                                    return (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="flex w-max items-center">
                                                    <div className="grid h-8 w-8 place-content-center rounded-full bg-primary text-sm font-semibold text-white ltr:mr-2 rtl:ml-2">{user.nom[0]}</div>
                                                    <div>{`${user.nom} ${user.prenoms}`}</div>
                                                </div>
                                            </td>
                                            <td>{user.email}</td>
                                            <td>{user.username}</td>
                                            <td>{user.role.libelle}</td>
                                            <td>{user.status === 1 ? <Chip color="success">Actif</Chip> : <Chip color="warning">Inactif</Chip>}</td>
                                            <td>
                                                <UsersTools user={user} value="list" />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {value === 'grid' && (
                <div className="mt-5 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {filteredItems.map((user: User) => {
                        return (
                            <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={user.id}>
                                <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
                                    <div className="rounded-t-md bg-white/40 bg-[url('/assets/images/notification-bg.png')] bg-cover bg-center p-6 pb-0">
                                        <div className="mx-auto h-20 w-20 rounded-full bg-primary text-3xl font-bold text-white flex items-center justify-center">{user.nom[0]}</div>
                                    </div>
                                    <div className="relative -mt-10 px-6 pb-24">
                                        <div className="rounded-md bg-white px-2 py-4 shadow-md dark:bg-gray-900">
                                            <div className="text-xl">{`${user.nom} ${user.prenoms}`}</div>
                                            <div className="text-white-dark">{user.role.libelle}</div>
                                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                                <div className="flex-auto">
                                                    <div className="text-info">{user.email}</div>
                                                    <div>Email</div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                
                                            </div>
                                        </div>
                                        <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                                            <div className="flex items-center">
                                                <div className="flex-none ltr:mr-2 rtl:ml-2">Nom d&apos;utilisateur :</div>
                                                <div className="">{user.username}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <UsersTools user={user} value="grid" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UsersList;
