'use client';
import {
    IconBuildingSkyscraper,
    IconCalendar,
    IconDashboard,
    IconDatabase,
    IconHome,
    IconLayoutDashboard,
    IconLock,
    IconMap,
    IconMotorbike,
    IconSettings,
    IconSettings2,
    IconTruck,
    IconTruckDelivery,
    IconUser,
    IconUsers,
    IconUsersGroup,
} from '@tabler/icons-react';
import { Bell, HandPlatter, SquareUser, Ticket } from 'lucide-react';
import { AiOutlineDollarCircle } from 'react-icons/ai';
import { TbMoneybag, TbTruckDelivery } from 'react-icons/tb';

export interface IMenuData {
    isHeader?: boolean;
    title: string;
    icon?: React.ElementType;
    path?: string;
    children?: IMenuData[];
}

const menuData: IMenuData[] = [
    { icon: IconLayoutDashboard, title: 'dashboard', path: '/' },
    {
        icon: IconMap,
        title: 'trafic',
        children: [
            { icon: IconMap, title: 'maps', path: '/trafic' },
            { icon: SquareUser, title: 'queue', path: '/trafic/file-attente' },
        ],
    },
    { icon: Ticket, title: 'ticket', path: '/tickets' },
    {
        icon: TbTruckDelivery,
        title: 'external_delivery',
        children: [
            { icon: TbTruckDelivery, title: 'external_delivery_new', path: '/external_delivery' },
            { icon: TbTruckDelivery, title: 'external_delivery_all', path: '/external_delivery/all' },
            // { icon: TbMoneybag, title: 'gestion_de_paie', path: '/external_delivery/gestion_de_paie' },
        ],
    },
    { icon: AiOutlineDollarCircle, title: 'price-list', path: '/price-list' },

    {
        icon: IconMotorbike,
        title: 'slot',
        children: [
            { icon: IconBuildingSkyscraper, title: 'slot', path: '/delivery-men/slot' },
            { icon: IconBuildingSkyscraper, title: 'slot-progression', path: '/delivery-men/creneau-progression' },
            { icon: IconBuildingSkyscraper, title: 'performance', path: '/delivery-men/performance' },

        ],
    },

    { icon: Bell, title: 'notification', path: '/notification' },

    // {
    //     icon: IconMotorbike,
    //     title: 'queue',
    //     path: '/file-attente',
    // },

    {
        isHeader: true,
        title: 'database',
        icon: IconDatabase,
        children: [
            {
                icon: IconUsers,
                title: 'users',
                children: [{ icon: IconUsersGroup, title: 'users', path: '/users' }],
            },
            {
                icon: HandPlatter,
                title: 'type_plats',
                path: '/type-plat',
            },
            {
                icon: IconBuildingSkyscraper,
                title: 'restaurants',
                children: [
                    { icon: IconBuildingSkyscraper, title: 'validated', path: '/restaurants' },
                    { icon: IconBuildingSkyscraper, title: 'partially_validated', path: '/restaurants/valide' },
                    { icon: IconBuildingSkyscraper, title: 'new', path: '/restaurants/not-valide' },
                ],
            },
            { icon: IconMotorbike, title: 'delivery_men', path: '/delivery-men' },
        ],
    },
    { isHeader: true, icon: IconSettings2, title: 'settings', children: [{ icon: IconUser, title: 'profile', path: '/settings/profile' }] },
];

export default menuData;
