'use client';

import { Button } from '@/components/ui/button';
import { Check, PencilIcon, XIcon } from 'lucide-react';
import React from 'react';
import { useTurboysBirdController } from './useTurboAssigneController';
import { SearchField } from '@/components/commons/form/search-field';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant } from '@/types/models';
import { Pagination, Tooltip } from '@heroui/react';
import { UpdateDeliveryDialog } from '../../update-delivery/update-delivery';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import EmptyDataTable from '@/components/commons/EmptyDataTable';


interface Props {
    initialData: PaginatedResponse<LivreurStatutVM> | null;
    restaurants?: Restaurant[] | null;
}
export default function Content({ initialData, restaurants }: Props) {
    const livreurNonAssingeCtrl = useTurboysBirdController(initialData);

    return (
        <div className="container mx-auto p-6 pt-0 flex-wrap">
            <SearchField searchKey={livreurNonAssingeCtrl.searchKey} onChange={livreurNonAssingeCtrl.setSearchKey} />
            <div className="bg-white rounded-lg overflow-x-auto lg:overflow-hidden xl:overflow-hidden md:overflow-x-auto ms:overflow-x-auto">
                <table className="min-w-full border-collapse w-full card shadown">
                    <tbody>
                        {
                            livreurNonAssingeCtrl.data && livreurNonAssingeCtrl.data.content.length === 0 ?
                                <div className='text-center mt-10 text-xl text-primary font-bold'>
                                    <EmptyDataTable title='Aucun Resultat' />
                                </div>
                                :
                                <div>
                                    {(livreurNonAssingeCtrl.data?.content && livreurNonAssingeCtrl.data?.content.length > 0) &&
                                        livreurNonAssingeCtrl.data?.content.map((item: any) => {
                                            if (!item) {
                                                return <></>
                                            }
                                            return <>
                                                <tr key={item.id} className="border-b hover:bg-gray-100 flex justify-between">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-7 h-7 rounded-full bg-gray-300"> </span>
                                                            <span> {item?.nomPrenom ? item.nomPrenom : 'Néant'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{item?.dateInscription}</td>
                                                    <td className="px-6 py-4 flex gap-4 items-center">

                                                        <Button variant={'confirm-success'} className="h-8">
                                                            <span className="flex items-center gap-2">
                                                                <Check size={18} />
                                                                Confirmé
                                                            </span>
                                                        </Button>
                                                        <span className="text-white  p-1 bg-gray-400  rounded-full hover:bg-red-500 cursor-pointer"
                                                            onClick={() => livreurNonAssingeCtrl.setUpdateLivreurId(item?.livreurId)}>
                                                            <PencilIcon className="h-4 w-4 " />
                                                        </span>
                                                        <span className="text-white p-1 bg-gray-400   rounded-full hover:bg-red-500 cursor-pointer"
                                                            onClick={() => livreurNonAssingeCtrl.supprimerLivreur(item, "WAITING")}>
                                                            <XIcon className=" h-4 w-4" />
                                                        </span>
                                                    </td>
                                                </tr>
                                                <div className='flex justify-end'>
                                                    {
                                                        livreurNonAssingeCtrl.updateLivreurId === item?.livreurId &&
                                                        <Button variant={'outline'} className='text-sm h-8' onClick={() => livreurNonAssingeCtrl.modifier(item)} >Modifier le turbo en turboy</Button>
                                                    }
                                                </div>
                                            </>
                                        })}
                                </div>
                        }
                    </tbody>
                </table>
                <UpdateDeliveryDialog
                    onClose={livreurNonAssingeCtrl.onClose}
                    isOpen={livreurNonAssingeCtrl.isOpen}
                    livreur={livreurNonAssingeCtrl.livreur}
                    typeLiveur="TURBO"
                    restaurants={restaurants || []} />
            </div>
            <ConfirmDialog {...livreurNonAssingeCtrl.confirm} />
            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination total={livreurNonAssingeCtrl.data?.totalPages ?? 1} page={livreurNonAssingeCtrl.currentPage}
                    onChange={livreurNonAssingeCtrl.fetchData} showControls color="primary" variant="bordered" isDisabled={livreurNonAssingeCtrl.isLoading} />
            </div>
        </div>
    );
}
