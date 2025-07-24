'use client';

import { useState } from 'react';
import { Input } from '@heroui/react';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination } from '@heroui/react';
import { Search } from 'lucide-react';
import { title } from '@/components/primitives';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import EmptyDataTable from '@/components/commons/EmptyDataTable';

interface ContentProps {
  initialData: PaginatedResponse<Restaurant> | null;
}

export default function Content({ initialData }: ContentProps) {
  const {
    columns,
    renderCell,
    renderCols,
    data,
    fetchData,
    currentPage,
    isLoading,
    filteredData,
    setFilteredData,
  } = useContentCtx({ initialData });

  const [searchName, setSearchName] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchName(value);

    if (!value.trim()) {
      // Reset filtre si recherche vide
      setFilteredData(null);
      return;
    }

    // Filtrer sur nom exact de la propriété
    const filtered = data?.content.filter((restaurant) =>
      restaurant.nomEtablissement.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered ?? []);
  };

  return (
    <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className={title({ size: 'h3', class: 'text-primary' })}>Restaurants</h1>
      </div>

      {/* Champ de recherche */}
      <Input
        startContent={<Search className="text-gray-500 w-4 h-4" />}
        label="Rechercher par nom"
        variant="bordered"
        placeholder="Entrez le nom du restaurant"
        value={searchName}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-1/2 mb-4"
        size="sm"
      />

      <Table aria-label="Liste des restaurants">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} align={'start'}>
              {renderCols(column)}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={filteredData ?? data?.content ?? []}
          emptyContent={<EmptyDataTable title="Aucun Restaurant" />}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey) as React.ReactNode}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="relative flex justify-center mt-8">
        <div className="absolute bottom-0 w-full h-12 bg-gray-200 blur-sm opacity-50 rounded-xl" />
        <Pagination
          total={data?.totalPages ?? 1}
          page={currentPage}
          onChange={fetchData}
          showControls
          color="primary"
          variant="bordered"
          isDisabled={isLoading || filteredData !== null} // désactive pagination pendant filtre
        />
      </div>
    </div>
  );
}
