'use client';

import React from 'react';

import OrdersPage from '@/app/(protected)/commandes/components/orders';
import type { Order, OrderStats, PageResponse, Restaurant } from '@/types/models';

/**
 * Le banc de l'ecran COMMANDES.
 *
 * <p>Il monte le VRAI composant de l'ecran ; seule la lecture reseau est remplacee par des
 * donnees d'exemple. Une commande porte volontairement un etat vide et une mesure du
 * bandeau est volontairement absente : ce sont les deux cas ou l'ecran mentait — une
 * pastille grise sans texte, et une carte qui affirmait zero faute de donnee.</p>
 */

const ADRESSES = [
    'Cocody Riviera 3, rue des Jardins, immeuble Palmier',
    'Plateau, avenue Franchet d Esperey, tour C',
    'Marcory Zone 4, boulevard VGE',
    'Yopougon Selmer, carrefour Ananeraie',
    'Abobo Baoule, face pharmacie du Rail',
];
const PAIEMENTS = ['ESPECES', 'WAVE', 'ORANGE MONEY', 'CARTE'];
const ETATS = ['PENDING', 'COMPLETED', 'CANCELLED', 'PENDING', '', 'REFUNDED'];

function article(i: number, n: number) {
    return {
        accompIds: n % 3 === 0 ? ['acc-1', 'acc-2'] : [],
        dateCreation: '2026-09-01T10:00:00',
        dateEdition: '2026-09-01T10:00:00',
        deleted: false,
        drinkIds: n % 2 === 0 ? ['drk-8f2c'] : [],
        id: `it-${i}-${n}`,
        optionId: null,
        optionValues: n % 2 === 0 ? ['Piment fort', 'Sans oignon'] : [],
        platId: `9f3b21c8-4d7e-4a10-b2f6-${String(100000 + i * 7 + n)}`,
        price: 2500 + n * 750,
        quantity: 1 + (n % 4),
        status: 1,
    };
}

function commande(i: number): Order {
    const articles = Array.from({ length: 1 + (i % 5) }).map((_, n) => article(i, n));
    const frais = 1000 + (i % 3) * 250;
    return {
        adresseM: {
            batName: i % 2 === 0 ? 'Residence Les Rosiers' : '',
            dateCreation: '2026-09-01T10:00:00',
            dateEdition: '2026-09-01T10:00:00',
            deleted: false,
            etage: i % 2 === 0 ? '3' : '',
            id: `ad-${i}`,
            infoSupl: i % 4 === 0 ? 'Portail bleu, sonner deux fois' : '',
            libelle: ADRESSES[i % ADRESSES.length],
            numeroPorte: i % 2 === 0 ? 'B12' : '',
            status: 1,
        },
        dateCreation: `2026-09-0${1 + (i % 7)}T1${i % 10}:2${i % 6}:11`,
        dateEdition: '2026-09-07T09:00:00',
        deleted: false,
        deliveryFee: frais,
        id: `4f8b0a2c-1d3e-4c5a-9b7d-00000000000${i}`,
        numero: String(43120 + i),
        orderItemM: articles,
        orderState: ETATS[i % ETATS.length],
        paymentMethod: PAIEMENTS[i % PAIEMENTS.length],
        recipientName: i % 3 === 0 ? 'Konan Amenan' : '',
        recipientPhone: i % 3 === 0 ? '+225 07 07 12 34 56' : '',
        restaurantId: `rest-${i % 4}`,
        serviceFee: 500,
        status: 1,
        totalAmount: articles.reduce((n, a) => n + a.price * a.quantity, frais + 500),
        userM: {
            avatarUrl: null,
            birthDay: '1990-01-01',
            dateCreation: '2026-01-01T10:00:00',
            dateEdition: '2026-01-01T10:00:00',
            deleted: false,
            email: 'client@exemple.ci',
            gender: 'M',
            id: `us-${i}`,
            nom: 'Traore',
            prenoms: 'Salif',
            status: 1,
            telephone: '+225 05 55 44 33 22',
        },
    } as unknown as Order;
}

// `Pageable` est lui aussi declare deux fois, donc fusionne : la page d'exemple ne porte
// que ce que l'ecran lit.
const PAGE = {
    content: Array.from({ length: 10 }).map((_, i) => commande(i)),
    empty: false,
    first: true,
    last: false,
    number: 0,
    numberOfElements: 10,
    pageable: {
        offset: 0,
        paged: true,
        pageNumber: 0,
        pageSize: 10,
        sort: { empty: false, sorted: true, unsorted: false },
        unpaged: false,
    },
    size: 10,
    sort: { empty: false, sorted: true, unsorted: false },
    totalElements: 340,
    totalPages: 34,
} as unknown as PageResponse<Order>;

// Le type `Restaurant` est declare DEUX fois dans types/models.ts, donc fusionne : il
// exige une vingtaine de champs dont ce banc n'a que faire. Seuls l'identifiant et le nom
// sont lus par l'ecran.
const RESTAURANTS = [
    { id: 'rest-0', nomEtablissement: 'Pizza Roma Cocody' },
    { id: 'rest-1', nomEtablissement: 'Chicken Nation Plateau' },
    { id: 'rest-2', nomEtablissement: 'Le Bistrot Marcory' },
    { id: 'rest-3', nomEtablissement: 'Allocodrome Riviera' },
] as unknown as Restaurant[];

// `completed` est volontairement absente : la carte doit dire qu'elle ne sait pas, et non
// afficher un zero.
const STATS = {
    cancelled: { amount: 1_450_000, nbre: 22 },
    pending: { amount: 4_820_000, nbre: 71 },
    total: { amount: 28_640_000, nbre: 340 },
} as unknown as OrderStats;

export default function ApercuCommandes() {
    // Les deux rembourrages de la coquille reelle, `p-6` de la zone de contenu et `p-2`
    // de la page, sont reproduits ici : la largeur restant au tableau est ce que ce banc
    // sert a verifier.
    return (
        <div className="min-h-screen bg-background">
            <div className="p-6">
                <div className="w-full">
                    <div className="flex w-full flex-col gap-6 p-2">
                        <h5 className="text-2xl font-bold text-primary">Mes Commandes</h5>
                        <OrdersPage commandesInitiales={PAGE} restaurants={RESTAURANTS} stats={STATS} />
                    </div>
                </div>
            </div>
        </div>
    );
}
