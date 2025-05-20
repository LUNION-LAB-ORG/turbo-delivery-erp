'use client';

import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { LivreurDisponible } from '@/types/models';
import createUrlFile from '@/utils/createUrlFile';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { darkMapStyle } from '@/data';

const defaultCenter = {
    lat: 5.345317,
    lng: -4.024429,
};

const defaultZoom = 11;

// Styles de carte pour le mode sombre

const iconCache = new Map<string, string>();

const createMarkerIcon = async (imageUrl: string, name: string, isDark: boolean) => {
    const cacheKey = `${imageUrl}-${name}-${isDark}`;
    if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)!;

    const canvas = document.createElement('canvas');
    const size = 80;
    const imgSize = 40;
    const textHeight = 20;

    canvas.width = size;
    canvas.height = size + textHeight;

    const ctx = canvas.getContext('2d')!;

    // Cercle blanc de fond
    ctx.fillStyle = isDark ? '#374151' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, imgSize / 2 + 4, 0, Math.PI * 2);
    ctx.fill();

    // Bordure verte
    ctx.strokeStyle = isDark ? '#059669' : '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, imgSize / 2 + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Clip pour l'image
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, imgSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    return new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
        img.onload = () => {
            ctx.drawImage(img, size / 2 - imgSize / 2, size / 2 - imgSize / 2, imgSize, imgSize);

            // Style du texte
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillStyle = isDark ? '#E5E7EB' : '#1F2937';
            ctx.fillText(name, size / 2, size + textHeight - 5);

            const dataUrl = canvas.toDataURL();
            iconCache.set(cacheKey, dataUrl);
            resolve(dataUrl);
        };
    });
};

type MapContainerProps = {
    couriers: LivreurDisponible[];
    selectedCourierId?: string | null;
    onMarkerClick?: (courierId: string) => void;
};

export default function MapContainer({ couriers, selectedCourierId, onMarkerClick }: MapContainerProps) {
  
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const containerStyle = {
        width: '100%',
        height: typeof window !== 'undefined' ? window.innerHeight - 180 + 'px' : '600px',
    };

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    });

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    useEffect(() => {
        if (map && selectedCourierId) {
            const selectedCourier = couriers.find((c) => c.livreurId === selectedCourierId);
            if (selectedCourier) {
                map.panTo({
                    lat: selectedCourier.position.latitude,
                    lng: selectedCourier.position.longitude,
                });
                const zoom = map.getZoom();
                if (zoom && zoom <= 18) {
                    map.setZoom(20);
                }
            }
        }
    }, [selectedCourierId, map, couriers]);

    if (loadError) return <div className="p-4 text-red-500 dark:text-red-400">Erreur de chargement de la carte</div>;
    if (!isLoaded) return <div className="p-4 dark:text-gray-300">Chargement de la carte...</div>;

    return (
        <div className="rounded-xl shadow-lg overflow-hidden">
            <GoogleMap
                mapContainerStyle={containerStyle}
                zoom={defaultZoom}
                center={couriers[0]?.position ? { lat: couriers[0].position.latitude, lng: couriers[0].position.longitude } : defaultCenter}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: isDark ? darkMapStyle : undefined,
                    disableDefaultUI: true,
                    zoomControl: true,
                }}
            >
                {couriers.map((courier) => {
                    const iconPromise = createMarkerIcon(createUrlFile(courier.avatarUrl, "backend"), courier.nomComplet, isDark);
                    
                    return (
                        <MarkerAsync
                            key={courier.livreurId}
                            position={{
                                lat: courier.position.latitude,
                                lng: courier.position.longitude,
                            }}
                            iconPromise={iconPromise}
                            onClick={() => {
                                onMarkerClick?.(courier.livreurId);
                            }}
                            animation={selectedCourierId === courier.livreurId ? google.maps.Animation.BOUNCE : undefined}
                        />
                    );
                })}
            </GoogleMap>
        </div>
    );
}

const MarkerAsync = ({ iconPromise, ...props }: any) => {
    const [iconUrl, setIconUrl] = useState<string | null>(null);

    useEffect(() => {
        iconPromise.then(setIconUrl);
    }, [iconPromise]);

    if (!iconUrl) return null;

    return (
        <Marker
            {...props}
            icon={{
                url: iconUrl,
                scaledSize: new window.google.maps.Size(80, 100),
                anchor: new google.maps.Point(40, 50),
            }}
        />
    );
};
