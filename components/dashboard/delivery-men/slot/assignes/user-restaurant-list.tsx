import { Restaurant } from "@/types/creneau-turbo";
import progresseBare from "../../progression/progression-barre";
import { IconPointFilled } from "@tabler/icons-react";
import DropDownAction from "../dropDownAction";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import { Avatar } from '@heroui-v3/react';
import { createUrlFile } from "@/utils/createUrlFile";
import { formatDate } from "@/utils/date-formate";


export default function UserRestaurantListe({ turboysCreneau }: { turboysCreneau: Restaurant[] }) {
    if (!turboysCreneau || turboysCreneau.length == 0) {
        return (
            <div>
                <h2 className="text-lg font-semibold mb-2">Restaurant ayant des créneaux</h2>
                <EmptyDataTable title="Aucun restaurant" />
            </div>
        )
    }

    return (
        <div className="relative mb-6 text-slate-500">
            <div className="relative mb-6">
                <h2 className="text-lg font-semibold bg-surface text-center w-full rounded-md shadow-sm py-2 mb-2">RESTAURANT(S) AYANT DES TURBOYS AVEC CRENEAU HORAIRE</h2>
                <div className="relative flex items-center flex-col gap-1 rounded-md overflow-auto">
                    {
                        turboysCreneau.map((restaurant, index) => {
                            return (
                                <div key={index} className="w-full bg-surface shadow-sm flex flex-col md:flex-row gap-4 border-2 rounded-md">
                                    <div className="relative w-full md:w-[180px] flex flex-col items-center text-center space-y-2 p-3">
                                        {/* Logo */}
                                        {/* Le repli etait `assets/images/avatar.png` — un
                                            chemin RELATIF, donc resolu depuis l'URL
                                            courante : sur `/delivery-men/slot/x`, il
                                            pointait vers `/delivery-men/slot/assets/…`,
                                            qui n'existe pas. L'image cassee s'affichait
                                            telle quelle. */}
                                        <Avatar className="size-12 shrink-0">
                                            {restaurant?.logo && (
                                                <Avatar.Image
                                                    alt={restaurant?.nomRestaurant ?? ''}
                                                    src={createUrlFile(restaurant.logo, 'restaurant')}
                                                />
                                            )}
                                            <Avatar.Fallback>
                                                {restaurant?.nomRestaurant?.[0]?.toUpperCase() ?? '?'}
                                            </Avatar.Fallback>
                                        </Avatar>

                                        {/* Nom restaurant */}
                                        <p className="text-md font-semibold">{restaurant.nomRestaurant}</p>

                                        {/* Nombre livreurs */}
                                        <p className="text-lg font-semibold">{restaurant.nombreLivreur}</p>
                                    </div>

                                    <div className="grow border-t-2 md:border-t-0 md:border-l-2 ">
                                        <div className="flex flex-col py-2 divide-y md:divide-y-0">
                                            {restaurant.livreurs.map((child) => {
                                                return (
                                                    <div key={child.id} className="font-semibold flex flex-wrap md:flex-nowrap items-center gap-y-1 px-2 py-2">
                                                        <div className="w-8">
                                                            <Avatar className="size-8 shrink-0">
                                                                {child?.avatar && (
                                                                    <Avatar.Image
                                                                        alt={child.nomComplet ?? ''}
                                                                        src={createUrlFile(child.avatar, 'backend')}
                                                                    />
                                                                )}
                                                                <Avatar.Fallback>
                                                                    {child?.nomComplet?.[0]?.toUpperCase() ?? '?'}
                                                                </Avatar.Fallback>
                                                            </Avatar>
                                                        </div>
                                                        <p className="w-[calc(100%-2rem)] md:w-2/6 text-md px-2">{child.nomComplet}</p>
                                                        <p className="w-1/2 md:w-1/5 px-2 text-sm">
                                                            <span className="pr-1">Inscrit le :</span> <span className="text-muted">{formatDate(child.dateInscrit, 'DD/MM/YYYY')}</span>
                                                        </p>
                                                        <p className="w-1/2 md:w-1/5 px-2 text-sm">
                                                            <span className="pr-1">Defini le: </span> <span className="text-muted">{child.dateDefiniEmploiTemps != null ? formatDate(child.dateDefiniEmploiTemps, 'DD/MM/YYYY') : '-' }</span>
                                                        </p>
                                                        <div className="relative w-full md:w-2/5 px-2 flex items-center justify-between">
                                                            {progresseBare(child)}
                                                            <span className="flex items-end mt-6">
                                                                {child.disponibilite
                                                                    ? <IconPointFilled color="#16B84E" size={30} />
                                                                    : <IconPointFilled color="#FF0000" size={30} />
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="px-2">
                                                            <DropDownAction id={child.id} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    )
}