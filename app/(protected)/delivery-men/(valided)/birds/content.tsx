'use client';

import { Button } from '@/components/ui/button';
import { Check, PencilIcon, XIcon } from 'lucide-react';
import React from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell
  } from "@heroui/react";
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
    const rows = livreurNonAssingeCtrl.data?.content || [];

    // Colonnes pour le tableau des livreurs non assignés
    const nonAssignedColumns = [
        { uid: "nom", name: "Nom & Prénom" },
        { uid: "dateInscription", name: "Date d’inscription" },
        { uid: "actions", name: "Actions" }
    ];
  
    // Fonction de rendu des cellules
    const renderNonAssignedCell = (item: any, columnKey: string) => {
        switch (columnKey) {
        case "nom":
            return (
                <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-gray-300" />
                    <span>{item?.nomPrenom ?? "Néant"}</span>
                </div>
            );
    
        case "dateInscription":
            return item?.dateInscription;
    
        case "actions":
            return (
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="confirm-success" className="h-8">
                        <span className="flex items-center gap-2">
                            <Check size={18} />
                            Confirmé
                        </span>
                    </Button>
        
                    <span className="text-white p-1 bg-gray-400 rounded-full hover:bg-red-500 cursor-pointer"
                        onClick={() => livreurNonAssingeCtrl.setUpdateLivreurId(item?.livreurId)}>
                    <PencilIcon className="h-4 w-4" />
                    </span>
        
                    <span className="text-white p-1 bg-gray-400 rounded-full hover:bg-red-500 cursor-pointer"
                        onClick={() => livreurNonAssingeCtrl.supprimerLivreur(item, "WAITING")}>
                        <XIcon className="h-4 w-4" />
                    </span>
        
                    {livreurNonAssingeCtrl.updateLivreurId === item?.livreurId && (
                        <Button variant="outline" className="text-sm h-8 ml-2" onClick={() => livreurNonAssingeCtrl.modifier(item)}>
                            Modifier le turbo en turboy
                        </Button>
                    )}
                </div>
            );
    
        default:
            return null;
        }
    };
  
    return (
        <div className="container mx-auto p-6 pt-0 flex-wrap">
            <SearchField searchKey={livreurNonAssingeCtrl.searchKey} onChange={livreurNonAssingeCtrl.setSearchKey} />
            <div className="bg-white rounded-lg overflow-x-auto lg:overflow-hidden xl:overflow-hidden md:overflow-x-auto ms:overflow-x-auto">
                <div className="bg-white rounded-lg overflow-x-auto py-4 shadow">
                    {rows.length === 0 ? (
                        <div className="text-center mt-10 text-xl text-primary font-bold">
                        <EmptyDataTable title="Aucun Résultat" />
                        </div>
                    ) : (
                        <>
                        <Table aria-label="Tableau des livreurs non assignés">
                            <TableHeader>
                            {nonAssignedColumns.map((col) => (
                                <TableColumn key={col.uid}>{col.name}</TableColumn>
                            ))}
                            </TableHeader>
                            <TableBody emptyContent="Aucun livreur à afficher.">
                            {rows.map((row: any) => (
                                <TableRow key={row.livreurId}>
                                {nonAssignedColumns.map((col) => (
                                    <TableCell key={col.uid}>{renderNonAssignedCell(row, col.uid)}</TableCell>
                                ))}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                        </>
                    )}
                </div>
                <UpdateDeliveryDialog
                    onClose={livreurNonAssingeCtrl.onClose}
                    isOpen={livreurNonAssingeCtrl.isOpen}
                    livreur={livreurNonAssingeCtrl.livreur}
                    typeLiveur="TURBO"
                    restaurants={restaurants || []} />
            </div>
            <ConfirmDialog {...livreurNonAssingeCtrl.confirm} />
            
            {/* Pagination conditionnelle */}
            {livreurNonAssingeCtrl.data && livreurNonAssingeCtrl.data.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <Pagination 
                        total={livreurNonAssingeCtrl.data.totalPages} 
                        page={livreurNonAssingeCtrl.currentPage}
                        onChange={livreurNonAssingeCtrl.setCurrentPage} 
                        showControls 
                        color="primary" 
                        variant="bordered" 
                        isDisabled={livreurNonAssingeCtrl.isLoading}
                        size="md"
                    />
                </div>
            )}
        </div>
    );
}