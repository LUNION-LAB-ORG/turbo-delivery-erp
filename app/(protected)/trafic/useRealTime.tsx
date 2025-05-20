import { socket } from '@/socket';
import { LivreurDisponible } from '@/types/models';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export default function useRealTime({ data, setData }: { data: LivreurDisponible[]; setData: Dispatch<SetStateAction<LivreurDisponible[]>> }) {
    const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onTraficLivreurEvent(value: any) {
            const newDeliver = JSON.parse(value) as LivreurDisponible;
            console.log({ nouvelle_position: newDeliver });
            setData((prevData) => {
                // Si le livreur existe dans la liste
                const isExist = prevData.find((d) => d.livreurId === newDeliver.livreurId);
                if (isExist) {
                    // Remplacer l'élément existant par le nouveau
                    return prevData.map((d) => (d.livreurId === newDeliver.livreurId ? newDeliver : d));
                } else {
                    // Si besoin, ajouter l'élément s'il n'existe pas déjà
                    return [...prevData, newDeliver];
                }
            });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        socket.on('/trafic/livreur/', onTraficLivreurEvent);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('/trafic/livreur/', onTraficLivreurEvent);
        };
    }, []);

    return {
        isConnected,
    };
}
