'use client';

import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, DatePicker, RangeValue, CalendarDate } from '@heroui/react';
import { title } from '@/components/primitives';
import { BonLivraison } from '@/types/bon-livraison.model';
import useContentCtx from './useContentCtx';
import { Calendar, Cherry, CircleFadingPlus, Home, SquareMenu, ToggleRight, User } from 'lucide-react';
import { PaginatedResponse } from '@/types';
import { useEffect, useState } from 'react';
import { Restaurant } from '@/types/models';
import { SelectField } from '@/components/commons/form/select-field';

interface ContentProps {
    initialData: PaginatedResponse<BonLivraison> | null;
    restaurants: Restaurant[]
}

export default function Content({ initialData, restaurants }: ContentProps) {
    const { columns, renderCell, data, handlerPage, handleDateChange, currentPage, isLoading, handleCangeRestaurant } = useContentCtx({ initialData, restaurants });
    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Gestions des tickets</h1>
            </div>
            <div className='grid grid-cols-4 gap-4'>
                <div className="flex flex-col gap-2 ">
                    <span>Rechercher par période</span>
                    {/* Utilise le DatePicker avec l'événement onChange */}
                    <DatePicker
                        className="max-w-[284px]"
                        onChange={handleDateChange} // Passe la fonction handleDateChange
                    />
                </div>
                <div className='flex flex-col gap-2'>
                    <span>Selectionnez un restaurant :</span>
                    <SelectField options={restaurants} optionLabel={"nomEtablissement"} optionValue={'nomEtablissement'} label='nomEtablissement'
                        setValue={handleCangeRestaurant} />
                </div>
            </div>

            <Table aria-label="Example table with custom cells">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
                            <div className="flex gap-2 text-primary">
                                {column.uid === 'reference' ? (
                                    <CircleFadingPlus size={15} />
                                ) : column.uid === 'date' ? (
                                    <Calendar size={15} />
                                ) : column.uid === 'livreur' ? (
                                    <User size={15} />
                                ) : column.uid === 'restaurant' ? (
                                    <Home size={15} />
                                ) : column.uid === 'coutLivraison' ? (
                                    <Cherry size={15} />
                                ) : column.uid === 'coutCommande' ? (
                                    <SquareMenu size={15} />
                                ) : column.uid === 'statut' ? (
                                    <ToggleRight size={15} />
                                ) : (
                                    <></>
                                )}
                                {column.name}
                            </div>
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={data?.content ?? []} emptyContent={'No rows to display.'}>
                    {(item) => <TableRow key={item.commandeId}>{(columnKey) => <TableCell>{renderCell(item, columnKey) as React.ReactNode}</TableCell>}</TableRow>}
                </TableBody>
            </Table>
            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination total={data?.totalPages ?? 1} page={currentPage} onChange={handlerPage} showControls color="primary" variant="bordered" isDisabled={isLoading} />
            </div>
        </div>
    );
}
