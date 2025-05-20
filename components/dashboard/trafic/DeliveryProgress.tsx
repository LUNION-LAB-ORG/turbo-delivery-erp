import React from 'react';
import { Receipt, Store, CheckCircle2, XCircle, CircleDot, MessageCircle } from 'lucide-react';
import { LivreurDisponible } from '@/types/models';
import Image from 'next/image';
import createUrlFile from '@/utils/createUrlFile';
import { Divider } from "@heroui/react";
import { motion } from 'framer-motion';

interface DeliveryProgressProps {
    livreur: LivreurDisponible;
}

export default function DeliveryProgress({ livreur }: DeliveryProgressProps) {
    const delivery = livreur.course!;
    const getProgressSteps = () => {
        switch (delivery.statut) {
            case 'EN_ATTENTE':
                return 3;
            case 'EN_COURS':
                return 8;
            case 'TERMINE':
                return 12;
            case 'VALIDER':
                return 15;
            case 'ANNULE':
                return 0;
            default:
                return 0;
        }
    };

    const isCompleted = delivery.statut === 'VALIDER';
    const isCancelled = delivery.statut === 'ANNULE';
    const currentProgress = getProgressSteps();
    const totalSteps = 15;
    const restaurantPosition = 7;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full p-4">
            {/* Header with locations */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                    <div className="flex items-start gap-3">
                        <div className="w-3 h-3 rounded-full bg-yellow-400 mt-2"></div>
                        <div>
                            <h3 className="font-medium text-gray-900">{delivery.restaurant?.nomEtablissement || 'Restaurant Agha - Marcory Zone 4'}</h3>
                            <p className="text-sm text-gray-500">Prise en charge • dans 3 minutes</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex items-start gap-3 justify-end">
                        <div className="flex items-center gap-2">
                            <Image src={createUrlFile(livreur.avatarUrl, 'delivery')} alt="Driver" className="w-8 h-8 rounded-full" width={32} height={32} />
                            <div className="text-right">
                                <p className="font-medium">Seka Franck</p>
                                <p className="text-sm text-gray-500">0145425765</p>
                            </div>
                        </div>
                        <button className="p-2 bg-green-500 rounded-full">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>
            <Divider />
            {/* Progress section */}
            <div className="w-full mt-2">
                <h2 className="text-xl font-semibold text-red-500 mb-6">Détails de la course</h2>

                <div className="flex items-center justify-between gap-2">
                    <Receipt className={`w-6 h-6 ${isCancelled ? 'text-gray-400' : 'text-red-500'}`} />

                    <div className="flex-grow flex items-center justify-between relative">
                        {/* Progress line */}
                        <div
                            className="absolute h-0.5 bg-red-500"
                            style={{
                                width: `${(currentProgress / totalSteps) * 100}%`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                left: 0,
                                zIndex: 0,
                            }}
                        />
                        <div
                            className="absolute h-0.5 bg-gray-200"
                            style={{
                                width: '100%',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                left: 0,
                                zIndex: -1,
                            }}
                        />

                        {Array.from({ length: totalSteps }, (_, index) => {
                            const isActive = index < currentProgress;
                            const isRestaurant = index === restaurantPosition;

                            if (isRestaurant) {
                                return <Store key={index} className={`w-4 h-4 z-10 ${isCancelled ? 'text-gray-400' : isActive ? 'text-red-500' : 'text-gray-300'}`} />;
                            }

                            return <CircleDot key={index} className={`w-2 h-2 z-10 ${isCancelled ? 'text-gray-300' : isActive ? 'text-red-500' : 'text-gray-300'}`} />;
                        })}
                    </div>

                    {isCancelled ? <XCircle className="w-6 h-6 text-red-500" /> : <CheckCircle2 className={`w-6 h-6 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} />}
                </div>

                {/* Status message */}
                {/* <div className="mt-4 flex items-center gap-2 text-red-500">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <p className="text-sm">Le coursier est parti pour le restaurant, arrive dans 3 min</p>
                </div> */}
            </div>
        </motion.div>
    );
}
