'use client';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import { RestaurantDefini } from '@/types/price-list';
import { Button, Tab, Tabs, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from '@heroui/react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import usePriceLiceDefined from './usePriceLiceDefined';
import { Search } from 'lucide-react';
import Link from 'next/link';

interface Props {
  initialData: RestaurantDefini[];
}

const tabsItems = [
  { id: '/price-list', href: '/price-list', label: 'Liste des restaurants définis' },
  { id: '/price-list/restaurants-undefined', href: '/price-list/restaurants-undefined', label: 'Liste des restaurants indéfinis' },
];

export default function Content({ initialData }: Props) {
  const { columns, selectedKey, tabs, tabsRef, deliveryFees, renderCell, handleMoveScroll, handleChangeSelectedKey } = usePriceLiceDefined({ initialData });

  return (
    <>
      {/* Onglets de navigation globale */}
      <Tabs color="primary" variant="underlined" items={tabsItems} selectedKey={tabsItems.find((tab) => tab.id === '/price-list')?.id} className="w-full">
        {(item) => <Tab key={item.id} as={Link} href={item.href} title={item.label} />}
      </Tabs>

      {/* Contenu de la page */}
      <div className="flex flex-col mt-4">
        <div className="relative flex items-center gap-4 border shadow rounded-xl py-1 px-1">
          <Button onPress={() => handleMoveScroll(-100)} variant="light" isIconOnly className="absolute left-2 z-[2] hidden sm:block">
            <IconChevronLeft />
          </Button>
          <Tabs
            variant="light"
            ref={tabsRef}
            items={tabs}
            selectedKey={selectedKey || (tabs.length > 0 ? tabs[0].id : '')}
            onSelectionChange={(key) => handleChangeSelectedKey(key.toString())}
            color="primary"
            className="relative w-11/12 mx-auto rounded-md"
          >
            {(item) => <Tab key={item.id} title={item.nomComplet} />}
          </Tabs>
          <Button onPress={() => handleMoveScroll(100)} variant="light" isIconOnly className="absolute right-2 z-[2] hidden sm:block">
            <IconChevronRight />
          </Button>
        </div>
        {/* Tableau de frais de livraison */}
        <Table aria-label="Tableau de Frais de livraison" className="mt-4">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} className={column.uid === 'zone' ? 'flex items-center gap-2' : ''} align={column.uid === 'actions' ? 'center' : 'start'}>
                {column.uid === 'zone' && <Search />} {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={deliveryFees} emptyContent={<EmptyDataTable title="Aucun Frais de Livraison" />}>
            {(item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column.uid}>{renderCell(item, column.uid)}</TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
