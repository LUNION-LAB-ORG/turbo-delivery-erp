'use client';

import { SelectField } from '@/components/commons/select-field';
import { Button } from '@/components/ui/button';
import { Check, PencilIcon, Save, XIcon } from 'lucide-react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react";
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
    initialData: PaginatedResponse<LivreurStatutVM> | null;
    restaurants: Restaurant[] | null
}



export default function Content({ initialData, restaurants }: Props) {
    const livreurAssigneCtrl = useTurboAssigneController(initialData, restaurants);
    const rows = livreurAssigneCtrl.data?.content || [];

    // Colonnes de la table
    const columns = [
        { uid: "nom", name: "Nom & Prénom" },
        { uid: "dateInscription", name: "Date d’inscription" },
        { uid: "restaurant", name: "Affectation" },
        { uid: "actions", name: "Actions" },
    ];
    
    // Fonction de rendu des cellules
    const renderCell = (item: any, columnKey: string) => {
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

            case "restaurant":
            return (
                <div onClick={() => livreurAssigneCtrl.setLivreur(item)}>
                <SelectField
                    options={restaurants || []}
                    selectValue={item?.restaurantLibelle}
                    livreur={item}
                    setLivreur={livreurAssigneCtrl.setLivreur}
                    setSelectValue={livreurAssigneCtrl.setRestaurantSelected}
                    label="nomEtablissement"
                />
                </div>
            );

            case "actions":
                const isModifiable =
                    livreurAssigneCtrl.livreur?.livreurId &&
                    livreurAssigneCtrl.restaurantSelected !== item?.restaurantLibelle &&
                    livreurAssigneCtrl.livreur?.livreurId === item?.livreurId;

            return (
                <div className="flex items-center gap-2 flex-wrap">
                {isModifiable ? (
                    <Button variant="destructive" className="h-8" onClick={() => livreurAssigneCtrl.changerRestaurantLivreurs(item)}>
                    <span className="flex items-center gap-2">
                        <Save size={18} />
                        Enregistrer
                    </span>
                    </Button>
                ) : (
                    <Button variant="confirm-success" className="h-8">
                    <span className="flex items-center gap-2">
                        <Check size={18} />
                        Confirmé
                    </span>
                    </Button>
                )}

                <span
                    className="text-white p-1 bg-gray-400 rounded-full hover:bg-red-500 cursor-pointer"
                    onClick={() => livreurAssigneCtrl.setUpdateLivreurId(item?.livreurId)}
                >
                    <PencilIcon className="h-5 w-5" />
                </span>
                <span
                    className="text-white p-1 bg-gray-400 rounded-full hover:bg-red-500 cursor-pointer"
                    onClick={() => livreurAssigneCtrl.supprimerLivreur(item)}
                >
                    <XIcon className="h-5 w-5" />
                </span>

                {livreurAssigneCtrl.updateLivreurId === item?.livreurId && (
                    <Button variant="outline" className="text-sm h-8" onClick={() => livreurAssigneCtrl.onConfirmStatut(item, "FREE")}>
                    Modifier le turbo en bird
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
            <SearchField searchKey={livreurAssigneCtrl.searchKey} onChange={livreurAssigneCtrl.setSearchKey} />
            <div className="bg-white rounded-lg overflow-x-auto p-4">
                {rows.length === 0 ? (
                    <div className="text-center py-6 text-primary font-bold mt-10 text-xl">
                    <EmptyDataTable title="Aucun Résultat" />
                    </div>
                ) : (
                    <>
                    <div className="border-b-2 mb-4 text-lg font-semibold">Aujourd&apos;hui</div>
                    <Table aria-label="Tableau des livreurs">
                        <TableHeader>
                        {columns.map((column) => (
                            <TableColumn key={column.uid}>{column.name}</TableColumn>
                        ))}
                        </TableHeader>
                        <TableBody emptyContent="Aucun livreur à afficher.">
                        {rows.map((row: any) => (
                            <TableRow key={row?.livreurId}>
                            {columns.map((column) => (
                                <TableCell key={column.uid}>{renderCell(row, column.uid)}</TableCell>
                            ))}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    <UpdateDeliveryDialog
                        onClose={livreurAssigneCtrl.onClose}
                        isOpen={livreurAssigneCtrl.isOpen}
                        livreur={livreurAssigneCtrl.livreur}
                        restaurants={restaurants}
                        typeLiveur="TURBO"
                    />
                    </>
                )}
            </div>
            <ConfirmDialog {...livreurAssigneCtrl.confirm} />

            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination 
                    total={livreurAssigneCtrl.data?.totalPages ?? 1} 
                    page={livreurAssigneCtrl.currentPage}
                    onChange={livreurAssigneCtrl.setCurrentPage} // Gère automatiquement pagination serveur/client
                    showControls 
                    color="primary" 
                    variant="bordered" 
                    isDisabled={livreurAssigneCtrl.isLoading} 
                />
            </div>

            <div className="flex justify-between items-center mt-4 px-4">
                <span className="text-sm text-gray-600">
                    Affichage de {((livreurAssigneCtrl.currentPage - 1) * 5) + 1} à {Math.min(livreurAssigneCtrl.currentPage * 5, livreurAssigneCtrl.data?.totalElements ?? 0)} sur {livreurAssigneCtrl.data?.totalElements ?? 0} résultats
                    {livreurAssigneCtrl.searchKey && ` (filtré de ${livreurAssigneCtrl.initialData?.totalElements ?? 0} total)`}
                </span>
            </div>
        </div>
    );
}
