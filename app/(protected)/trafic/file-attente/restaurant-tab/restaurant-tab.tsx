import { Tab, Tabs } from "@heroui/react";
import { ListeRestaurants } from './liste-restaurant/liste-restaurant';
import { ListTree } from 'lucide-react';
import { FilleAttenteHistoriqueVM, FilleAttenteVM } from '@/types/file-attente.model';
import { MoveLeft } from "lucide-react";

interface RestaurantsTabProps {
    fileAttentes: FilleAttenteHistoriqueVM[];
    accesRapideData?: FilleAttenteVM[];
    fileAttenteSelected: any;
    onSelectFileAttente: (restaurantId: any) => void;
}
export function RestaurantsTab({ fileAttentes, accesRapideData, fileAttenteSelected, onSelectFileAttente }: RestaurantsTabProps) {
    return (
        <div className="mt-4">
            <div className="flex mb-5">
                <ListTree className="mr-2" />
                <span className="text-gray-500">Trier</span>
            </div>
            {
                fileAttenteSelected && accesRapideData ?
                    <>
                        <span className="flex justify-end mr-10">
                            <div className="flex gap-2 text-blue-400 cursor-pointer ietms-center">
                                <MoveLeft size={18} /> <a onClick={() => onSelectFileAttente && onSelectFileAttente(null)} className="text-blue-400">Retour</a>
                            </div>
                        </span>
                        <ListeRestaurants datas={accesRapideData} />
                    </>
                    :

                    <Tabs items={fileAttentes || []} className="w-full">
                        {(item) => (
                            <Tab key={item.restaurantId} title={item.restaurant}>
                                <ListeRestaurants datas={item.fileAttentes} />
                            </Tab>
                        )}
                    </Tabs>
            }

        </div>
    );
}
