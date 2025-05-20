import React, { useState } from 'react';
import { LivreurDisponible } from '@/types/models';
import createUrlFile from '@/utils/createUrlFile';
import { Avatar } from "@heroui/react";
import DeliveryProgress from './DeliveryProgress';

interface LivreurTimelineProps {
    livreurs: LivreurDisponible[];
    handleCourierSelect: (courierId: string) => void;
}

export function LivreurTimeline({ livreurs: livreursEnCourse, handleCourierSelect }: LivreurTimelineProps) {
    const livreursActifs = livreursEnCourse.filter((l) => l.course);
    const [selectedDeliver, setSelectedDeliver] = useState<LivreurDisponible | null>(null);

    const handleClick = (id: string) => {
        handleCourierSelect(id);
        const liv = livreursActifs.find((l) => l.livreurId == id);

        if (liv) {
            if (selectedDeliver?.livreurId == liv.livreurId) {
                setSelectedDeliver(null);
            } else {
                setSelectedDeliver(liv);
            }
        }
    };
    return (
        <div className="w-full mx-auto">
            <h2 className="lg:text-xl font-bold text-primary mb-4">En circulation</h2>
            <div className="relative mb-8 overflow-auto scrollbar-thin">
                <div className="absolute inset-0 bg-gray-200 rounded-full h-fit flex flex-nowrap scrollbar-thin" />
                {/* Base timeline */}
                <div className="flex flex-nowrap">
                    {livreursActifs.map((livreur, index) => {
                        const colors = ['bg-indigo-700', 'bg-rose-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500'];

                        return (
                            <div key={livreur.livreurId} onClick={() => handleClick(livreur.livreurId)} className="flex flex-col justify-center gap-2 shrink-0 cursor-pointer">
                                <div
                                    className={`h-3 w-10  ${!selectedDeliver ? colors[index % colors.length] : selectedDeliver.livreurId == livreur.livreurId ? 'bg-primary' : 'bg-gray-700'}  rounded-full`}
                                />

                                <Avatar
                                    src={createUrlFile(livreur.avatarUrl, 'delivery')}
                                    alt={livreur.nomComplet}
                                    className={`w-10 h-10 border-2 ${selectedDeliver && selectedDeliver.livreurId == livreur.livreurId ? 'border-primary' : 'border-white'} shadow-sm`}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedDeliver && <DeliveryProgress livreur={selectedDeliver} />}
        </div>
    );
}
