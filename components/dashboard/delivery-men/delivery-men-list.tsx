'use client';

import IconSearch from '@/components/icon/icon-search';
import IconUserPlus from '@/components/icon/icon-user-plus';
import React, { useState } from 'react';
import { DeliveryMan } from '@/types/models';
import { PaginatedResponse } from '@/types';
import DeliveryMenTools from './delivery-men-tools';
import { Chip } from '@heroui/react';

const DeliveryMenList = ({ deliveryMen, validateBy = 'no-body' }: { deliveryMen: PaginatedResponse<DeliveryMan> | null; validateBy: 'auth' | 'ops' | 'no-body' }) => {
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
                    </div>
                    <div className="relative">
                        <input type="text" placeholder="Rechercher des livreurs" className="peer form-input py-2 ltr:pr-11 rtl:pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                                            <DeliveryMenTools deliveryMan={deliveryMan} validateBy={validateBy} />
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

export default DeliveryMenList;
