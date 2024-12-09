'use client';
import {
    IconBuildingSkyscraper,
    IconCalendar,
    IconDashboard,
    IconDatabase,
    IconHome,
    IconLayoutDashboard,
    IconLock,
    IconMotorbike,
    IconSettings,
    IconSettings2,
    IconTruck,
    IconTruckDelivery,
    IconUser,
    IconUsers,
    IconUsersGroup,
} from '@tabler/icons-react';
import { HandPlatter } from 'lucide-react';

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
                title: 'collections',
                path: '/collections',
            },
            {
                icon: IconBuildingSkyscraper,
                title: 'restaurants',
                children: [
                    { icon: IconBuildingSkyscraper, title: 'validated', path: '/restaurants' },
                    { icon: IconBuildingSkyscraper, title: 'partially_validated', path: '/restaurants/valide' },
                    { icon: IconBuildingSkyscraper, title: 'not_validated', path: '/restaurants/not-valide' },
                ],
            },
            {
                icon: IconMotorbike,
                title: 'delivery_men',
                children: [
                    { icon: IconBuildingSkyscraper, title: 'validated', path: '/delivery-men' },
                    { icon: IconBuildingSkyscraper, title: 'partially_validated', path: '/delivery-men/valide' },
                    { icon: IconBuildingSkyscraper, title: 'not_validated', path: '/delivery-men/not-valide' },
                ],
            },
        ],
    },
    { isHeader: true, icon: IconSettings2, title: 'settings', children: [{ icon: IconUser, title: 'profile', path: '/settings/profile' }] },
];

export default menuData;
