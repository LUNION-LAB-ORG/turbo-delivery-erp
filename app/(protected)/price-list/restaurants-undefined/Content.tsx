'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantDefini } from '@/types/price-list';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Tabs, Tab } from '@heroui/react';
import useContent from './useContent';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface Props {
  initialData: RestaurantDefini[];
}

export const columns = [
  { name: 'Nom du restaurent', uid: 'nomEtablissement' },
  { name: 'Type de commission', uid: 'typeCommission' },
  { name: 'Actions', uid: 'actions' },

];

const tabsItems: {
  id: string;
  href: string;
  label: string;
}[] = [
    { id: '/price-list', href: '/price-list', label: 'Liste des restaurants definis' },
    { id: '/price-list/restaurants-undefined', href: '/price-list/restaurants-undefined', label: 'Liste des restaurants indefinis' },
  ];

export default function Content({ initialData }: Props) {
  const { undefinedRestaurant, renderCell } = useContent({ initialData });

  return (
    <Tabs color="primary" variant="underlined" items={tabsItems} selectedKey={'/price-list/restaurants-undefined'} className="w-full">
      {(item) => {
        return (
          <Tab key={item.id} as={Link} href={item.href} title={item.label}>*
            <div className="flex flex-col">
              <Table aria-label="Tableau de Frais de livraison">
                <TableHeader columns={columns}>
                  {(column) => (
                    <TableColumn className={`${column.uid == 'nomEtablissement' ? 'flex items-center gap-2' : ''}`} key={column.uid}>
                      {column.uid === 'nomEtablissement' && <Search />} {column.name}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody items={undefinedRestaurant ? undefinedRestaurant : []} emptyContent={<EmptyDataTable title="Aucun Frais de Livraison" />}>
                  {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
                </TableBody>
              </Table>
            </div>
          </Tab>
        );
      }}
    </Tabs>
  );
}
