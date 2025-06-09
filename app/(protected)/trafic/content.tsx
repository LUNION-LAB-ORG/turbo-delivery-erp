'use client';

import { useState } from 'react';
import MapContainer from '@/components/dashboard/trafic/MapContainer';
import { LivreurDisponible } from '@/types/models';
import useRealTime from './useRealTime';
import SearchBar from './searchBar';
import { LivreurTimeline } from '@/components/dashboard/trafic/LivreurTimeline';
import { LivreursListBottom } from '@/components/dashboard/trafic/LivreursListBottom';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LayoutDashboard } from 'lucide-react';

export default function Content({ data }: { data: LivreurDisponible[] }) {
    const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
    const [updatedData, setUpdatedData] = useState<LivreurDisponible[]>(data);
    const [openDashboard, setOpenDashboard] = useState<boolean>(false);
    const { isConnected } = useRealTime({ data: updatedData, setData: setUpdatedData });

    const handleCourierSelect = (courierId: string) => {
        setSelectedCourierId(courierId);
    };

    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative top-1 flex h-3 w-3 ltr:-right-1 rtl:-left-1">
                        <span
                            className={`absolute -top-[3px] inline-flex h-full w-full animate-ping rounded-full ${isConnected ? 'bg-green-500/50' : 'bg-red-500/50'}  opacity-75 ltr:-left-[3px] rtl:-right-[3px]`}
                        ></span>
                        <span className={`relative inline-flex h-[6px] w-[6px] rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>{' '}
                    Actuellement Connectés :
                    <SearchBar coursiers={updatedData.filter((deliver) => deliver.position && deliver.position.latitude && deliver.position.longitude)} handleCourierSelect={handleCourierSelect} />
                </div>
            </div>
            <div className="relative">
                <MapContainer
                    couriers={updatedData.filter((deliver) => deliver.position && deliver.position.latitude && deliver.position.longitude)}
                    selectedCourierId={selectedCourierId}
                    onMarkerClick={handleCourierSelect}
                />

                <div className="w-full absolute -bottom-8">
                    <AnimatePresence mode="wait">
                        {!openDashboard ? (
                            <motion.div
                                key="open-button"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full bg-background rounded-t-3xl p-2 flex justify-center"
                            >
                                <Button onClick={() => setOpenDashboard(true)} isIconOnly startContent={<LayoutDashboard />} variant="bordered" color="primary" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 100 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="w-full"
                            >
                                <Card className="w-full max-w-4xl mx-auto h-fit relative">
                                    <CardHeader className="flex justify-center items-center">
                                        <Button className="relative" size="sm" onClick={() => setOpenDashboard(false)} isIconOnly startContent={<ChevronDown />} variant="light" />
                                    </CardHeader>
                                    <CardBody className="space-y-2 px-8">
                                        <LivreurTimeline livreurs={updatedData} handleCourierSelect={handleCourierSelect} />
                                        <LivreursListBottom livreurs={updatedData} handleCourierSelect={handleCourierSelect} />
                                    </CardBody>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
