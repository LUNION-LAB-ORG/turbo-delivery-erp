'use client';

import { LivreurDisponible } from '@/types/models';
import createUrlFile from '@/utils/createUrlFile';
import Image from 'next/image';
import { Phone } from 'lucide-react';

type Props = {
    couriers: LivreurDisponible[];
    selectedCourierId?: string | null;
    onCourierClick: (courierId: string) => void;
};

export default function CourierList({ couriers, selectedCourierId, onCourierClick }: Props) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Coursiers en activité ({couriers?.length})
                </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {couriers && couriers.map((courier) => (
                    <div
                        key={courier.livreurId}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                            selectedCourierId === courier.livreurId ? 'bg-gray-50 dark:bg-gray-700/50' : ''
                        }`}
                        onClick={() => onCourierClick(courier.livreurId)}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Image
                                    src={createUrlFile(courier.avatarUrl, 'delivery')}
                                    alt={courier.nomComplet}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
                                    width={48}
                                    height={48}
                                    priority
                                />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {courier.nomComplet}
                                </p>
                                <div className="flex items-center mt-1 space-x-2">
                                    <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{courier.telephone}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30">
                                <span className="text-xs font-medium text-green-800 dark:text-green-400">
                                    En livraison
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}