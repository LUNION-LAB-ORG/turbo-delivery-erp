'use client';

import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem } from "@heroui/react";
import createUrlFile from '@/utils/createUrlFile';
import { DeliveryMan } from '@/types/models';

export default function Content({ driver }: { driver: DeliveryMan | null }) {
    const router = useRouter();
    return (
        <div className="min-h-screen">
            <header className="border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div onClick={() => router.back()} className="text-gray-600 dark:text-white hover:text-primary cursor-pointer">
                            <ArrowLeft className="h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                            {driver?.nom} {driver?.prenoms}
                        </h1>
                    </div>
                    {/* <div className="flex gap-4">
                        <Button variant="bordered">Créer un profil</Button>
                        <Button variant="bordered">Modifier</Button>
                    </div> */}
                </div>
            </header>

            <main className="container mx-auto lg:px-4 py-8">
                <div className="space-y-6">
                    <div className="flex justify-center mb-8">
                        <div className="relative w-32 h-32 rounded-full overflow-hidden">
                            <Image src={createUrlFile(driver?.avatarUrl ?? '', "backend")} alt="Photo du livreur" fill className="object-cover" />
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-red-600">Informations Personnelles</h2>
                        </CardHeader>
                        <CardBody className="md:grid grid-cols-2 gap-6">
                            <Input label="Nom" labelPlacement="outside" value={driver?.nom ?? ''} variant="bordered" />
                            <Input label="Prénom" labelPlacement="outside" value={driver?.prenoms ?? ''} variant="bordered" />
                            <Input label="Date de naissance" labelPlacement="outside" value={driver?.birthDay ?? ''} variant="bordered" />
                            <Input label="Téléphone" labelPlacement="outside" value={driver?.telephone ?? ''} variant="bordered" />
                            <Input label="Domicile" labelPlacement="outside" value={driver?.habitation ?? ''} variant="bordered" />
                            <Input label="Adresse mail" type="email" labelPlacement="outside" value={driver?.email ?? ''} variant="bordered" />
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-red-600">Document d&apos;identité</h2>
                        </CardHeader>
                        <CardBody className="space-y-6">
                            <Input label="Numéro de la pièce" labelPlacement="outside" value={driver?.numeroCni ?? ''} variant="bordered" />
                            <div>
                                <p className="text-sm font-medium mb-2">Photo de la pièce</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                                        <Image src={createUrlFile(driver?.cniUrlR ?? '', 'backend')} alt={`Photo de la pièce Recto`} fill className="object-cover" />
                                        <Image src={createUrlFile(driver?.cniUrlV ?? '', 'backend')} alt={`Photo de la pièce Verso`} fill className="object-cover" />
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold text-red-600">Informations du véhicule</h2>
                        </CardHeader>
                        <CardBody className="md:grid grid-cols-2 gap-6">
                            <Select label="Type" labelPlacement="outside" defaultSelectedKeys={[driver?.category ?? '']} variant="bordered">
                                <SelectItem key="dispatcher" value={driver?.category ?? 'dispatcher'}>
                                    Dispatcher
                                </SelectItem>
                                <SelectItem key="livreur" value="livreur">
                                    Livreur
                                </SelectItem>
                            </Select>
                            {/* <Input label="Nom du véhicule" labelPlacement="outside" value={driver.nomVehicule} variant="bordered" />
                            <Input label="Immatriculation du véhicule" labelPlacement="outside" value={driver.immatriculation} variant="bordered" />
                            <div className="col-span-2">
                                <p className="text-sm font-medium mb-2">Photo du véhicule</p>
                                <div className="relative aspect-video rounded-lg overflow-hidden">
                                    <Image src={createUrlFile(driver.photoVehiculeUrl, 'vehicle')} alt="Photo du véhicule" fill className="object-cover" />
                                </div>
                            </div> */}
                        </CardBody>
                    </Card>
                </div>
            </main>
        </div>
    );
}
