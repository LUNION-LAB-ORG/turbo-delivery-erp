'use client';

import IconSearch from '@/components/icon/icon-search';
import React, { useState } from 'react';
import { Restaurant } from '@/types/models';
import { PaginatedResponse } from '@/types';
import RestaurantTools from './restaurant-tools';
import { Chip } from '@heroui/react';

const RestaurantList = ({ restaurants, validateBy = 'no-body' }: { restaurants: PaginatedResponse<Restaurant> | null; validateBy: 'auth' | 'ops' | 'no-body' }) => {
    const [search, setSearch] = useState<string>('');

    const filteredItems =
        restaurants?.content.filter((restaurant) => restaurant.nomEtablissement.toLowerCase().includes(search.toLowerCase()) || restaurant.localisation.toLowerCase().includes(search.toLowerCase())) ||
        [];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">Restaurants</h2>
                <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                    <div className="relative">
                        <input type="text" placeholder="Rechercher des restaurants" className="peer form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button type="button" className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]">
                            <IconSearch className="mx-auto" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="panel mt-5 overflow-hidden border-0 p-0">
                <div className="table-responsive">
                    <table className="table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Nom de l&apos;établissement</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Localisation</th>
                                <th>Statut</th>
                                <th className="!text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((restaurant: Restaurant) => {
                                return (
                                    <tr key={restaurant.id}>
                                        <td>
                                            <div className="flex w-max items-center">
                                                <div className="grid h-8 w-8 place-content-center rounded-full bg-primary text-sm font-semibold text-white ltr:mr-2 rtl:ml-2">
                                                    {restaurant.nomEtablissement[0]}
                                                </div>
                                                <div>{restaurant.nomEtablissement}</div>
                                            </div>
                                        </td>
                                        <td>{restaurant.email}</td>
                                        <td>{restaurant.telephone}</td>
                                        <td>{restaurant.localisation}</td>
                                        <td>
                                            {restaurant.status == 1 ? (
                                                <Chip>En attente</Chip>
                                            ) : restaurant.status == 2 ? (
                                                <Chip color="warning">Partiellement</Chip>
                                            ) : (
                                                <Chip color="success">Validé</Chip>
                                            )}
                                        </td>
                                        <td>
                                            <RestaurantTools restaurant={restaurant} validateBy={validateBy} />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RestaurantList;
