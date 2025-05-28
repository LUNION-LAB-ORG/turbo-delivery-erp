'use client';

import { CardHeader } from '@/components/commons/card-header';
import { PageWrapper } from '@/components/commons/page-wrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import React from 'react';
import RestaurantCards from './restaurant-card/restaurant-card';
import { RestaurantsTab } from './restaurant-tab/restaurant-tab';
import { Search, Map } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Input } from "@heroui/react";
import { useFileAttenteController } from '@/components/dashboard/trafic/file-attente/file-attente.controller';
import { FileAttenteStatistiqueVM } from '@/types/file-attente.model';

interface Props {
    statistiqueFileAttentes: FileAttenteStatistiqueVM | null;
}
export default function RestaurantContent({ statistiqueFileAttentes }: Props) {
    const { fileAttentes, refreshData, onSelectFileAttente, selectedData, setFileAttentSeled, fileAttenteSelected } = useFileAttenteController();

    return (
        <PageWrapper>
            <div className="space-y-4">
                <CardHeader title="File d'attente" />
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-full sm:w-auto">
                        <Input
                            startContent={<Search size={20} />}
                            placeholder="Rechercher un coursier ou un restaurant"
                            className="w-full"
                        />
                    </div>
                    <Link href="/trafic">
                        <Badge className="rounded-full pr-4 cursor-pointer flex items-center justify-center">
                            <Map className="mr-2" size={20} /> Maps
                        </Badge>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full">
                <Card className="bg-slate-200 box-shadow text-center p-4 w-full md:w-1/2 lg:w-1/3">
                    <div className="text-md mt-2">{statistiqueFileAttentes ? statistiqueFileAttentes?.coursier : 0 + " "} Turboys</div>
                    <Button variant="destructive" className="mt-8 w-full text-md hover:bg-red-300">
                        Voir la liste
                    </Button>
                </Card>
                <Card className="bg-slate-200 box-shadow text-center p-4 w-full md:w-1/2 lg:w-1/3">
                    <div className="text-md mt-2">{statistiqueFileAttentes ? statistiqueFileAttentes?.restaurant : 0 + " "} Partenaires</div>
                    <Button variant="destructive" className="mt-8 w-full text-md hover:bg-red-300">
                        Voir la liste
                    </Button>
                </Card>
                <Card className="bg-slate-200 box-shadow text-center p-4 w-full md:w-1/2 lg:w-1/3">
                    <div className="text-md mt-2">{statistiqueFileAttentes ? statistiqueFileAttentes?.commandeEnAttente : 0 + " "} commande(s) en attente</div>
                    <Button variant="destructive" className="mt-8 w-full text-md hover:bg-red-300">
                        Voir la liste
                    </Button>
                </Card>
                <Card className="bg-slate-200 box-shadow text-center p-4 w-full md:w-1/2 lg:w-1/3">
                    <div className="text-md mt-2">{statistiqueFileAttentes ? statistiqueFileAttentes?.commandeTermine : 0 + " "} commande(s) terminée(s)</div>
                    <Button variant="destructive" className="mt-8 w-full text-md hover:bg-red-300">
                        Voir la liste
                    </Button>
                </Card>
            </div>

            <RestaurantCards fileAttentes={fileAttentes} refreshData={refreshData}
                setFileAttentSeled={setFileAttentSeled}
                onSelectFileAttente={onSelectFileAttente}
                fileAttenteSelected={fileAttenteSelected}
            />
            <RestaurantsTab fileAttentes={fileAttentes} accesRapideData={selectedData} fileAttenteSelected={fileAttenteSelected} onSelectFileAttente={onSelectFileAttente} />
        </PageWrapper>
    );
}
