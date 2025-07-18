'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantDefini } from '@/types/price-list';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Tabs, Tab, Pagination } from '@heroui/react';
import useContent from './useContent';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { PaginatedResponse } from '@/types';

interface Props {
    initialData: PaginatedResponse<RestaurantDefini> | null;
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
    const { renderCell, data, fetchData, currentPage, isLoading } = useContent({ initialData });

  return (
    <div>
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
                  <TableBody items={data?.content ?? []} emptyContent={<EmptyDataTable title="Aucun Frais de Livraison" />}>
                    {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}</TableRow>}
                  </TableBody>
                </Table>
              </div>
            </Tab>
          );
        }}
      </Tabs>
      <div className="relative flex justify-center mt-8">
        <div className="absolute bottom-0 w-full h-12 bg-gray-200 blur-sm opacity-50 rounded-xl" />
        <Pagination
          total={data?.totalPages ?? 1}
          page={currentPage}
          onChange={fetchData}
          showControls
          color="primary"
          variant="bordered"
          isDisabled={isLoading}
        />
      </div>
    </div>
  );
}
