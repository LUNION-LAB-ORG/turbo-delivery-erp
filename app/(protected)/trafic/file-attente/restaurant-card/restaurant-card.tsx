'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { FilleAttenteHistoriqueVM, FilleAttenteVM } from '@/types/file-attente.model';
import { RefreshCcw } from 'lucide-react';

interface RestaurantCardsProps {
    fileAttentes: FilleAttenteHistoriqueVM[];
    refreshData?: () => void;
    setFileAttentSeled: (restaurantId: any) => void;
    onSelectFileAttente: (restaurantId: any) => void;
    fileAttenteSelected: any;
}
export default function RestaurantCards({ fileAttentes, refreshData, fileAttenteSelected, onSelectFileAttente }: RestaurantCardsProps) {
    return (
        <>
            <div className="flex gap-20 text-gray-500 pt-2">
                <span>Accès rapîde</span>
                <span className="cursor-pointer text-red-500  hover:text-red-300" onClick={refreshData}>
                    <RefreshCcw />
                </span>
            </div>
            <div className="flex flex-wrap gap-4">
                {fileAttentes &&
                    fileAttentes.length > 0 &&
                    fileAttentes.map((restaurant: FilleAttenteHistoriqueVM) => (
                        <Card
                            key={restaurant.restaurantId}
                            className={`relative p-4 w-full sm:w-60 h-auto rounded-lg transition-all cursor-pointer shadow-md ${fileAttenteSelected === restaurant.restaurantId ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-gray-200'
                                }`}
                            onClick={() => onSelectFileAttente(restaurant.restaurantId)}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Avatar className="w-6 h-6">
                                    <AvatarImage src={'/assets/images/photos/galaxy.png'} alt={''} />
                                </Avatar>
                                <span className="font-semibold">{restaurant.restaurant}</span>
                            </div>
                            <div className="flex -space-x-2 mb-4 pt-4 items-center">
                                {restaurant.fileAttentes &&
                                    restaurant.fileAttentes.length > 0 &&
                                    restaurant.fileAttentes.map((user: FilleAttenteVM, index) => {
                                        if (index < 7) {
                                            return (
                                                <Avatar key={index} className="w-8 h-8 border-2 border-white">
                                                    <AvatarImage src={'https://cdn-icons-png.flaticon.com/512/2499/2499292.png'} alt="User" />
                                                </Avatar>
                                            );
                                        }
                                    })}
                                <span className="pl-4">{restaurant.fileAttentes && restaurant.fileAttentes?.length > 3 && ' ...'}</span>
                            </div>
                        </Card>
                    ))}
            </div>
        </>
    );
}
