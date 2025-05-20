
"use client"

import { CardHeader } from "@/components/commons/card-header"
import EmptyState from "@/components/commons/EmptyState";
import { PageWrapper } from "@/components/commons/page-wrapper";
import { Card } from "@/components/ui/card";
import DataTable from "@/components/ui/data-table";
import { Calendar, Cherry, ChevronRight, CircleAlert, CircleFadingPlus, Home, MoveLeft, SquareMenu, ToggleRight, User } from "lucide-react";
import Link from "next/link";

interface Props {
    data: any[]
}
export function DetailContent({ data }: Props) {
    const colomns = [
        {
            accessorKey: "id",
            header: () => {
                return (
                    <div className="flex">
                        <CircleAlert className="mr-2" size={15} /> ID
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="flex items-center">
                        # {row.original.id}
                    </div>
                );
            },
        },
        {
            accessorKey: "reference",
            header: () => {
                return (
                    <div className="flex">
                        <CircleFadingPlus className="mr-2 bg-red-500 rounded-full p-0 text-white border-none" size={15} /> Réference
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="flex items-center">
                        {row.original.reference}
                    </div>
                );
            },
        },
        {
            accessorKey: "dateHeure",
            header: () => {
                return (
                    <div className="flex">
                        <Calendar className="mr-2" size={15} /> Date et heure
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="flex items-center">
                        {row.original.dateHeure}
                    </div>
                )
            },
        },
        {
            accessorKey: "livreur",
            header: () => {
                return (
                    <div className="flex">
                        <User className="mr-2" size={15} /> Livreur
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="flex items-center">
                        {row.original.livreur}
                    </div>
                )
            },
        },
        {
            accessorKey: "restaurant",
            header: () => {
                return (
                    <div className="flex">
                        <Home className="mr-2" size={15} /> Restaurant
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="flex items-center">
                        <ChevronRight className="mr-2 text-red-500" /> {row.original.restaurant}
                    </div>
                )
            },
        },
        {
            accessorKey: "coutLivraison",
            header: () => {
                return (
                    <div className="flex">
                        <Cherry className="mr-2" size={15} /> Coût de livraison
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="font-bold">
                        {row.original.coutLivraison}
                    </div>

                )
            },
        },
        {
            accessorKey: "coutCommande",
            header: () => {
                return (
                    <div className="flex">
                        <SquareMenu className="mr-2" size={15} /> Coût commande
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="font-bold">
                        {row.original.coutCommande}
                    </div>
                )
            },
        },
        {
            accessorKey: "authentif",
            header: () => {
                return (
                    <div className="flex">
                        <ToggleRight className="mr-2" size={15} /> Authentif
                    </div>
                )
            },
            cell: ({ row }: any) => {
                return (
                    <div className="flex items-center">
                        <ToggleRight className="mr-2 text-red-300" size={30} />
                    </div>
                )
            },
        }
    ];
    return (
        <PageWrapper>
            <CardHeader title={"Detail de Krah Ecric - 01/02/2025"} />
            <Card className="p-4">
                <DataTable.Root columns={colomns} data={data}>
                    <div className={"flex items-center justify-end"}>
                        <div className={"flex gap-4 items-center"}>
                            <DataTable.SearchInput />
                            <div className="flex justify-end cursor-pointer text-red-500"><MoveLeft className="mr-2" /><Link href={"/analystics/pay-slip"}>Retour à la liste</Link></div>
                        </div>
                    </div>
                    <DataTable.Table />

                    <DataTable.Empty>
                        <EmptyState
                            title={""}
                            subtitle={"Aucune donnée n'est disponible actuellement"}
                        />
                    </DataTable.Empty>
                </DataTable.Root>
            </Card>
        </PageWrapper>
    )
}