'use client';

import { DatePickers } from '@/components/ui/date-piker';
import { Tab, Tabs } from "@heroui/react";
import { colorMap } from '@/data';
import { ListeDesLivraisons } from '@/components/dashboard/releve-de-paie/liste-des-livraisons/liste-des-livraisons';

export default function Content() {
    const tabs = [
        { id: '1', nomComplet: 'Krah éric', montant: '125000' },
        { id: '2', nomComplet: "N'ndri Jena", montant: '13500' },
        { id: '3', nomComplet: 'Nguessan drissa', montant: '690000' },
        { id: '4', nomComplet: 'Siriki Yao', montant: '1680000' },
        { id: '5', nomComplet: 'Brou Kouamé', montant: '1580000' },
        { id: '6', nomComplet: 'Krah éric', montant: '125000' },
        { id: '7', nomComplet: "N'ndri Jena", montant: '13500' },
        { id: '8', nomComplet: 'Nguessan drissa', montant: '690000' },
        { id: '9', nomComplet: 'Siriki Yao', montant: '1680000' },
        { id: '10', nomComplet: 'Brou Kouamé', montant: '1580000' },
    ];

    return (
        <div>
            <div className="mb-2">
                <DatePickers />
            </div>
            <div className="relative flex items-center gap-4 ">
                <Tabs items={tabs} className="w-[90%] rounded-md shadow mr-10">
                    {(item) => {
                        const initial = item.nomComplet.charAt(0).toUpperCase();
                        const bgColor = colorMap[initial] || 'bg-gray-400';
                        return (
                            <Tab
                                key={item.id}
                                title={
                                    <div className="flex justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-full text-white font-bold ${bgColor}`}>{initial}</div>
                                            <div className="flex">
                                                <span className="text-gray-800 font-medium">{item.nomComplet}</span>
                                                <span className="ml-5 font-bold">{item.montant}</span>
                                            </div>
                                        </div>
                                    </div>
                                }
                            />
                        );
                    }}
                </Tabs>
                <span className=" absolute right-0 bg-slate-700 text-white z-[1000] p-2 rounded-full pl-4 pr-4">Les tops 10</span>
            </div>
            <ListeDesLivraisons />
        </div>
    );
}
