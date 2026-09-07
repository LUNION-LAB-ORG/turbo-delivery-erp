'use client';

import IconSearch from '@/components/icon/icon-search';
import React, { useState } from 'react';
import { Collection } from '@/types/models';

import { Avatar, Chip } from '@heroui-v3/react';
import TypePlatsTools from './type-plats-tools';
import { createUrlFile } from '@/utils/createUrlFile';
import TypePlatAdd from './type-plats-add';
import { Can } from '@/components/auth/Can';

const TypePlatsList = ({ typePlats }: { typePlats: Collection[] }) => {
    const [search, setSearch] = useState<string>('');
    const filteredItems = typePlats?.filter((typePlat) => typePlat.libelle.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">Type de plats : {filteredItems.length}</h2>
                <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex gap-3">
                        <Can I="manage" a="Menu">
                            <div>
                                <TypePlatAdd />
                            </div>
                        </Can>
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Rechercher des utilisateurs" className="peer form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button type="button" className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]">
                            <IconSearch className="mx-auto" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="panel mt-5 hidden overflow-hidden border-0 p-0 md:block">
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Libellé</th>
                                <th>Description</th>
                                <th>Statut</th>
                                <th className="text-center!">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((typePlat: Collection) => {
                                return (
                                    <tr key={typePlat.id}>
                                        <td>
                                            <div className="flex w-max items-center">
                                                <Avatar className="mr-2 size-9 shrink-0">
                                                    {typePlat.pictureUrl && (
                                                        <Avatar.Image
                                                            alt={typePlat.libelle}
                                                            src={createUrlFile(typePlat.pictureUrl, 'erp')}
                                                        />
                                                    )}
                                                    <Avatar.Fallback>
                                                        {typePlat.libelle?.[0]?.toUpperCase() ?? '?'}
                                                    </Avatar.Fallback>
                                                </Avatar>
                                                <div>{typePlat.libelle}</div>
                                            </div>
                                        </td>
                                        <td>{typePlat.description}</td>
                                        <td>{typePlat.status === 1 ? (
                                            <Chip color="success" size="sm" variant="soft">
                                                <Chip.Label>Actif</Chip.Label>
                                            </Chip>
                                        ) : (
                                            <Chip size="sm" variant="soft">
                                                <Chip.Label>Inactif</Chip.Label>
                                            </Chip>
                                        )}</td>
                                        <td>
                                            <TypePlatsTools typePlat={typePlat} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile — une carte par type de plat (remplace le tableau < md) */}
            <div className="mt-5 space-y-3 md:hidden">
                {filteredItems.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted">Aucun type de plat trouvé</p>
                ) : (
                    filteredItems.map((typePlat: Collection) => (
                        <div key={typePlat.id} className="space-y-2 rounded-xl border border-separator bg-surface p-4 shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Avatar className="size-9 shrink-0">
                                        {typePlat.pictureUrl && (
                                            <Avatar.Image
                                                alt={typePlat.libelle}
                                                src={createUrlFile(typePlat.pictureUrl, 'erp')}
                                            />
                                        )}
                                        <Avatar.Fallback>
                                            {typePlat.libelle?.[0]?.toUpperCase() ?? '?'}
                                        </Avatar.Fallback>
                                    </Avatar>
                                    <p className="truncate text-sm font-semibold text-foreground">{typePlat.libelle}</p>
                                </div>
                                {typePlat.status === 1 ? (
                                            <Chip color="success" size="sm" variant="soft">
                                                <Chip.Label>Actif</Chip.Label>
                                            </Chip>
                                        ) : (
                                            <Chip size="sm" variant="soft">
                                                <Chip.Label>Inactif</Chip.Label>
                                            </Chip>
                                        )}
                            </div>

                            {typePlat.description ? (
                                <div className="flex items-center justify-between gap-3">
                                    <span className="shrink-0 text-xs text-muted">Description</span>
                                    <span className="truncate text-right text-sm text-foreground">{typePlat.description}</span>
                                </div>
                            ) : null}

                            <div className="flex justify-end pt-1">
                                <TypePlatsTools typePlat={typePlat} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TypePlatsList;
