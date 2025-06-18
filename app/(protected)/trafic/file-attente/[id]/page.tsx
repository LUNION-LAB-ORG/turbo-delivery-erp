import { CardHeader } from '@/components/commons/card-header';
import { PageWrapper } from '@/components/commons/page-wrapper';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { Search, Map } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const data = [
    {
        id: '1',
        rang: 'Position 4',
        nomPrenom: 'Kossonou yao',
        numero: 'Thursday 42',
        photo: 'https://cdn-icons-png.flaticon.com/512/2499/2499292.png',
    },
    {
        id: '2',
        rang: 'Position 2',
        nomPrenom: 'Jhone Kouamé',
        numero: 'Thursday 28',
        photo: 'https://cdn-icons-png.flaticon.com/512/2499/2499292.png',
    },
];
export default async function Page() {

    // const { id } = useParams()

    // console.log(id);
    
    // const [actRow, setActiveRow] = useState("")

    return ( <PageWrapper>
            <div className="">
                <CardHeader title="File d'attente" />
                <div className="flex gap-4 w-1/4">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-400 border-red-500" size={20} />
                        <Input placeholder="Rechercher un coursier ou un restaurant" className="pl-10 rounded-lg bg-white border-2 h-10" />
                    </div>
                    <Link href={'/trafic'}>
                        <Badge className="rounded-full pr-4 cursor-pointer">
                            {' '}
                            <Map className="mr-4" size={30} /> Maps
                        </Badge>
                    </Link>
                </div>
            </div>
            <div className="flex justify-start items-center w-full">
                <div className="flex gap-10tems-center justify-around card border-3 rounded-lg bg-white p-4 w-2/3 ">
                    <div>
                        <span className="mb-5 tex-sm text-red-400">Position</span>
                        <div className="text-6xl text-red-500 font-bold">1</div>
                    </div>
                    <div>
                        <div className="">
                            <span className="font-bold text-xl">Commandes #2555</span>
                            <br />
                            <span className="text-gray-500">Temps de récupération</span>
                        </div>
                        <div className="text-center">
                            <span className="text-2xl text-gray-500 text-center pt-2">00:30</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 ml-auto flex-shrink-0">
                    <Button variant={'success'} className="h-8 rounded-lg">
                        Écrire à une turbo
                    </Button>
                    <Button variant={'success'} className="h-8 rounded-lg ">
                        Écrire au partenaire
                    </Button>
                    <Button variant={'destructive'} className="h-8 rouded-full">
                        Signaler une erreur
                    </Button>
                </div>
            </div>

            <div className="w-full  mt-10">
                <span className="ml-2 text-gray-500 pb-4">En attente</span>
                {data.map((item: any) => (
                    <div
                        key={item.id}
                        // onClick={() => setActiveRow(item.id)}
                        // className={`flex items-center gap-10 p-3 mb-2 rounded-md border cursor-pointer
                        //      ${actRow === item.id && "bg-orange-300"}`
                        //     }
                    >
                        <span className={`px-3 py-1 rounded-md border-3`}>{item?.rang}</span>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                            <span className="font-semibold">{item?.nomPrenom ? item.nomPrenom : 'Néant'}</span>
                            <span className="text-red-500 font-bold ml-5">{item?.numero}</span>
                        </div>
                        <a className="text-blue-500 ml-auto cursor-pointer">Ajourner</a>
                    </div>
                ))}
            </div>
        </PageWrapper>
    );
}
