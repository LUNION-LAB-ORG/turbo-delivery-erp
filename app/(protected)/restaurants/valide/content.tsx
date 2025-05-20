'use client';

import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination } from '@heroui/react';
import { title } from '@/components/primitives';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { Restaurant } from '@/types/models';
import EmptyDataTable from '@/components/commons/EmptyDataTable';

interface ContentProps {
    initialData: PaginatedResponse<Restaurant> | null;
}

export default function Content({ initialData }: ContentProps) {
    const { columns, renderCell, renderCols, data, fetchData, currentPage, isLoading } = useContentCtx({ initialData });

    return (
        <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Restaurants partiellement validés</h1>
            </div>
            <Table aria-label="Example table with custom cells">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid} align={'start'}>
                            {renderCols(column)}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={data?.content ?? []} emptyContent={<EmptyDataTable title='Aucun Restaurant' />}>
                    {(item) => <TableRow key={item.id}>{(columnKey) => <TableCell>{renderCell(item, columnKey) as React.ReactNode}</TableCell>}</TableRow>}
                </TableBody>
            </Table>
            <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
                <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
                <Pagination total={data?.totalPages ?? 1} page={currentPage} onChange={fetchData} showControls color="primary" variant="bordered" isDisabled={isLoading} />
            </div>
        </div>
    );
}
