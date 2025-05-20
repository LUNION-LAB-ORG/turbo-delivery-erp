
import { Paginations } from "@/components/commons/paginations";
import { useListeRestaurantController } from "@/components/dashboard/trafic/file-attente/liste-restaurant.controller";
import { FilleAttenteVM } from "@/types/file-attente.model";
import Link from "next/link";

interface Props {
    datas?: FilleAttenteVM[];
}
export function ListeRestaurants({ datas }: Props) {
    const ctrl = useListeRestaurantController({ datas })
    return (
        <>
            <div className="container mx-auto  overflow-auto">
                <div className="w-[500px] lg:w-full xl:w-full md:w-full mt-4 bg-white rounded-lg p-4 overflow-auto">
                    <div className="grid grid-cols-4 font-semibold text-gray-500 p-2 border-b">
                        <span>Rang</span>
                        <span>Nom et prénoms</span>
                        <span>Numéro livreur</span>
                    </div>
                    {(ctrl.paginationDatas && ctrl.paginationDatas.length > 0) &&
                        ctrl.paginationDatas.map((item: FilleAttenteVM) => (
                            <div
                                key={item.id}
                                className="grid grid-cols-4 items-center gap-4 p-3 border-b cursor-pointer hover:bg-gray-200"
                            >
                                <span className="px-3 py-1 rounded-lg border-3 hover:border-white card text-sm">
                                    {item.position}
                                </span>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full">{""}</div>
                                    <span className="font-semibold">{item.nomComplet}</span>
                                </div>
                                <span className="text-red-500 font-bold">{item.dateJour}</span>
                                <Link href={"/trafic/file-attente/" + item.id}>
                                    <span className="text-blue-500 text-right">Ajourner</span>
                                </Link>

                            </div>
                        ))}
                </div>

            </div>
            <Paginations currentPage={ctrl.currentPage} setCurrentPage={ctrl.setCurrentPage}
                prevPage={ctrl.prevPage} datas={datas} className="mt-3" />
        </>

    )
}
