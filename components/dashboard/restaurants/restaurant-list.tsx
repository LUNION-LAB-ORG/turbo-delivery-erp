'use client';

import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconListCheck from '@/components/icon/icon-list-check';
import IconSearch from '@/components/icon/icon-search';
import React, { useState } from 'react';
import { Restaurant } from '@/types/models';
import { PaginatedResponse } from '@/types/index';
import restaurantsEndpoints from '@/src/endpoints/restaurants.endpoint';
import RestaurantTools from './restaurant-tools';
import { Chip } from '@nextui-org/react';

const RestaurantList = ({ restaurants, validateBy = 'no-body' }: { restaurants: PaginatedResponse<Restaurant> | null; validateBy: 'auth' | 'ops' | 'no-body' }) => {
    const [value, setValue] = useState<'list' | 'grid'>('list');
    const [search, setSearch] = useState<string>('');

    const filteredItems =
        restaurants?.content.filter((restaurant) => restaurant.nomEtablissement.toLowerCase().includes(search.toLowerCase()) || restaurant.localisation.toLowerCase().includes(search.toLowerCase())) ||
        [];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">Restaurants</h2>
                <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex gap-3">
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
                        <input type="text" placeholder="Rechercher des restaurants" className="peer form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                                                <RestaurantTools restaurant={restaurant} value="list" validateBy={validateBy} />
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
                    {filteredItems.map((restaurant: Restaurant) => {
                        return (
                            <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={restaurant.id}>
                                <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
                                    <div className="rounded-t-md bg-white/40 bg-[url('/assets/images/notification-bg.png')] bg-cover bg-center p-6 pb-0">
                                        <div className="mx-auto h-20 w-20 rounded-full bg-primary text-3xl font-bold text-white flex items-center justify-center">{restaurant.nomEtablissement[0]}</div>
                                    </div>
                                    <div className="relative -mt-10 px-6 pb-24">
                                        <div className="rounded-md bg-white px-2 py-4 shadow-md dark:bg-gray-900">
                                            <div className="text-xl">{restaurant.nomEtablissement}</div>
                                            <div className="text-white-dark">{restaurant.localisation}</div>
                                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                                <div className="flex-auto">
                                                    <div className="text-info">{restaurant.email}</div>
                                                    <div>Email</div>
                                                </div>
                                            </div>
                                            <div className="mt-4"></div>
                                        </div>
                                        <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                                            <div className="flex items-center">
                                                <div className="flex-none ltr:mr-2 rtl:ml-2">Téléphone :</div>
                                                <div>{restaurant.telephone}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <RestaurantTools restaurant={restaurant} value="grid" validateBy={validateBy} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RestaurantList;
