'use client';

import IconFacebook from '@/components/icon/icon-facebook';
import IconInstagram from '@/components/icon/icon-instagram';
import IconLayoutGrid from '@/components/icon/icon-layout-grid';
import IconLinkedin from '@/components/icon/icon-linkedin';
import IconListCheck from '@/components/icon/icon-list-check';
import IconSearch from '@/components/icon/icon-search';
import IconTwitter from '@/components/icon/icon-twitter';
import IconUserPlus from '@/components/icon/icon-user-plus';
import React, { useState } from 'react';
import { DeliveryMan } from '@/types/models';
import { PaginatedResponse } from '@/types/index';
import DeliveryMenTools from './delivery-men-tools';
import { Chip } from '@nextui-org/react';

const DeliveryMenList = ({ deliveryMen, validateBy = 'no-body' }: { deliveryMen: PaginatedResponse<DeliveryMan> | null; validateBy: 'auth' | 'ops' | 'no-body' }) => {
    const [value, setValue] = useState<'list' | 'grid'>('list');
    const [search, setSearch] = useState<string>('');

    const filteredItems =
        deliveryMen?.content.filter((livreur) => livreur.matricule.toLowerCase().includes(search.toLowerCase()) || livreur.telephone.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl">Livreurs</h2>
                <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex gap-3">
                        <div>
                            <button type="button" className="btn btn-primary" onClick={() => {}}>
                                <IconUserPlus className="ltr:mr-2 rtl:ml-2" />
                                Ajouter un livreur
                            </button>
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
                        <input type="text" placeholder="Rechercher des livreurs" className="peer form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                                    <th>Matricule</th>
                                    <th>Téléphone</th>
                                    <th>Statut</th>
                                    <th>Date de création</th>
                                    <th>Statut</th>
                                    <th className="!text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((deliveryMan: DeliveryMan) => {
                                    return (
                                        <tr key={deliveryMan.id}>
                                            <td>
                                                <div className="flex w-max items-center">
                                                    <div className="grid h-8 w-8 place-content-center rounded-full bg-primary text-sm font-semibold text-white ltr:mr-2 rtl:ml-2">
                                                        {deliveryMan.matricule[0]}
                                                    </div>
                                                    <div>{deliveryMan.matricule}</div>
                                                </div>
                                            </td>
                                            <td>{deliveryMan.telephone}</td>
                                            <td>{deliveryMan.status === 2 ? 'Actif' : 'Inactif'}</td>
                                            <td>{new Date(deliveryMan.dateCreation).toLocaleDateString()}</td>
                                            <td>
                                                {deliveryMan.status == 2 ? (
                                                    <Chip>En attente</Chip>
                                                ) : deliveryMan.status == 3 ? (
                                                    <Chip color="warning">Partiellement</Chip>
                                                ) : (
                                                    <Chip color="success">Validé</Chip>
                                                )}
                                            </td>
                                            <td>
                                                <DeliveryMenTools deliveryMan={deliveryMan} value={value} validateBy={validateBy} />
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
                    {filteredItems.map((deliveryMan: DeliveryMan) => {
                        return (
                            <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]" key={deliveryMan.id}>
                                <div className="relative overflow-hidden rounded-md bg-white text-center shadow dark:bg-[#1c232f]">
                                    <div className="rounded-t-md bg-white/40 bg-[url('/assets/images/notification-bg.png')] bg-cover bg-center p-6 pb-0">
                                        <div className="mx-auto h-20 w-20 rounded-full bg-primary text-3xl font-bold text-white flex items-center justify-center">{deliveryMan.matricule[0]}</div>
                                    </div>
                                    <div className="relative -mt-10 px-6 pb-24">
                                        <div className="rounded-md bg-white px-2 py-4 shadow-md dark:bg-gray-900">
                                            <div className="text-xl">{deliveryMan.matricule}</div>
                                            <div className="text-white-dark">{deliveryMan.telephone}</div>
                                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                                <div className="flex-auto">
                                                    <div className="text-info">{deliveryMan.status === 2 ? 'Actif' : 'Inactif'}</div>
                                                    <div>Statut</div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <ul className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary h-7 w-7 rounded-full p-0">
                                                            <IconFacebook />
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary h-7 w-7 rounded-full p-0">
                                                            <IconInstagram />
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary h-7 w-7 rounded-full p-0">
                                                            <IconLinkedin />
                                                        </button>
                                                    </li>
                                                    <li>
                                                        <button type="button" className="btn btn-outline-primary h-7 w-7 rounded-full p-0">
                                                            <IconTwitter />
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="mt-6 grid grid-cols-1 gap-4 ltr:text-left rtl:text-right">
                                            <div className="flex items-center">
                                                <div className="flex-none ltr:mr-2 rtl:ml-2">Date de création :</div>
                                                <div className="text-white-dark">{new Date(deliveryMan.dateCreation).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <DeliveryMenTools deliveryMan={deliveryMan} value={value} validateBy={validateBy} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DeliveryMenList;
