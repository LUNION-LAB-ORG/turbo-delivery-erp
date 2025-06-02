'use client';

import { SelectField } from '@/components/commons/select-field';
import { Button } from '@/components/ui/button';
import { Check, PencilIcon, Save, XIcon } from 'lucide-react';
import React from 'react';
import { useTurboAssigneController } from './useTurboAssigneController';
import { SearchField } from '@/components/commons/form/search-field';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant, TypeEnum } from '@/types/models';
import { UpdateDeliveryDialog } from '../../update-delivery/update-delivery';
import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { Pagination } from '@heroui/react';

interface Props {
    initialData: PaginatedResponse<LivreurStatutVM[]> | null;
    restaurants: Restaurant[] | null
}
export default function Content({ initialData, restaurants }: Props) {
    const livreurAssigneCtrl = useTurboAssigneController(initialData, restaurants);

    return (
        <div className="container mx-auto p-6 pt-0 flex-wrap">
            <SearchField searchKey={livreurAssigneCtrl.searchKey} onChange={livreurAssigneCtrl.setSearchKey} />
            <div className="bg-white rounded-lg overflow-x-auto lg:overflow-hidden xl:overflow-hidden md:overflow-x-auto ms:overflow-x-auto">
                {
                    livreurAssigneCtrl.data && livreurAssigneCtrl.data.content.length === 0 ?
                        <div className="text-center py-6 text-primary font-bold mt-10 text-xl">
                            <EmptyDataTable title='Aucun Resultat' />
                        </div>
                        :
                        <>
                            <div className="border-b-2 m-4 w-full  flex-1">Aujourd&apos;hui</div>
                            <table className="min-w-full border-collapse w-full">
                                <tbody>
                                    {(livreurAssigneCtrl.data?.content || [])?.map((item: any) => {
                                        return (
                                            <>
                                                <tr key={item.id} className="border-b hover:bg-gray-100 flex justify-between">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-7 h-7 rounded-full bg-gray-300"> </span>
                                                            <span> {item.nomPrenom}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 ">{item.dateInscription}</td>
                                                    <td className="w-[300px] py-4 " onClick={() => livreurAssigneCtrl.setLivreur(item)}>
                                                        <SelectField options={restaurants || []}
                                                            selectValue={item.restaurantLibelle}
                                                            livreur={item}
                                                            setLivreur={livreurAssigneCtrl.setLivreur}
                                                            setSelectValue={livreurAssigneCtrl.setRestaurantSelected} label={'nomEtablissement'} />
                                                    </td>
                                                    <td className="px-6 py-4 flex gap-4 items-center">
                                                        {
                                                            (livreurAssigneCtrl.livreur?.livreurId &&
                                                                livreurAssigneCtrl.restaurantSelected !== item.restaurantLibelle &&
                                                                livreurAssigneCtrl.livreur.livreurId === item.livreurId) ? (
                                                                <Button variant={'destructive'} className="h-8" onClick={() => livreurAssigneCtrl.changerRestaurantLivreurs(item)}>
                                                                    <span className="flex items-center gap-2">
                                                                        <Save size={18} />
                                                                        Engregistrer
                                                                    </span>
                                                                </Button>
                                                            ) : (
                                                                <Button variant={'confirm-success'} className="h-8">
                                                                    <span className="flex items-center gap-2">
                                                                        <Check size={18} />
                                                                        Confirmé
                                                                    </span>
                                                                </Button>
                                                            )
                                                        }


                                                        <span className="text-white  p-1 bg-gray-400  rounded-full hover:bg-red-500 cursor-pointer"
                                                            onClick={() => livreurAssigneCtrl.setUpdateLivreurId(item.livreurId)}>
                                                            <PencilIcon className="h-5 w-5 " />
                                                        </span>
                                                        <span className="text-white p-1 bg-gray-400   rounded-full hover:bg-red-500 cursor-pointer"
                                                            onClick={() => livreurAssigneCtrl.supprimerLivreur(item)}>
                                                            <XIcon className=" h-5 w-5" />
                                                        </span>
                                                    </td>
                                                    {/* </td> */}

                                                </tr>
                                                <div className='flex justify-end'>
                                                    {
                                                        livreurAssigneCtrl.updateLivreurId === item.livreurId &&
                                                        <Button variant={'outline'} className='text-sm h-8' onClick={() => livreurAssigneCtrl.onConfirmStatut(item, "FREE")} >Modifier le turbo en bird</Button>
                                                    }
                                                </div>
                                            </>

                                        )
                                    })}
                                </tbody>
                            </table>
                            <UpdateDeliveryDialog
                                onClose={livreurAssigneCtrl.onClose}
                                isOpen={livreurAssigneCtrl.isOpen}
                                livreur={livreurAssigneCtrl.livreur}
                                restaurants={restaurants}
                                typeLiveur="TURBO"
                            />
                        </>
                }
            </div>
            <ConfirmDialog {...livreurAssigneCtrl.confirm} />
            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination total={livreurAssigneCtrl.data?.totalPages ?? 1} page={livreurAssigneCtrl.currentPage}
                    onChange={livreurAssigneCtrl.fetchData} showControls color="primary" variant="bordered" isDisabled={livreurAssigneCtrl.isLoading} />
            </div>

        </div>
    );
}
