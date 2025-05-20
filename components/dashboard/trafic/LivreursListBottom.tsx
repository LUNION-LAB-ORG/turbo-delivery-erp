'use client';

import { LivreurDisponible } from '@/types/models';
import createUrlFile from '@/utils/createUrlFile';
import { Avatar, Divider } from "@heroui/react";

interface LivreursListProps {
    livreurs: LivreurDisponible[];
    handleCourierSelect: (courierId: string) => void;
}

export function LivreursListBottom({ livreurs, handleCourierSelect }: LivreursListProps) {
    const livreursLibres = livreurs.filter((l) => !l.course);

    const handleClick = (id: string) => {
        handleCourierSelect(id);
    };

    return (
        <div className="w-full mx-auto mt-8">
            <h2 className="lg:text-xl font-bold text-primary mb-4">Encore libre</h2>
            <div className="flex gap-2 flex-nowrap overflow-auto scrollbar-thin">
                {livreursLibres.map((livreur, index) => (
                    <div onClick={() => handleClick(livreur.livreurId)} key={livreur.livreurId} className="shrink-0 flex items-center gap-2 cursor-pointer">
                        <Avatar src={createUrlFile(livreur.avatarUrl, 'delivery')} alt={livreur.nomComplet} className="w-8 h-8 border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]" />
                        <span className="text-xs font-medium text-gray-800 text-center">{livreur.nomComplet}</span>
                        {index !== livreursLibres.length - 1 && <Divider orientation="vertical" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
