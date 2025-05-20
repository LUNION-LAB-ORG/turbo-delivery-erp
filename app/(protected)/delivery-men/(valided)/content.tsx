'use client';

import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Pagination, Modal, ModalContent, ModalHeader, ModalBody, Button, ModalFooter } from '@heroui/react';
import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant } from '@/types/models';
import { SearchField } from '@/components/commons/form/search-field';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { UpdateDeliveryDialog } from '../update-delivery/update-delivery';
import DeliveryMenStatusValidate from '@/components/dashboard/delivery-men/delivery-men-status-validate';

interface ContentProps {
  initialData: PaginatedResponse<LivreurStatutVM[]> | null;
  restaurants: Restaurant[] | null;
}

export default function Content({ initialData, restaurants }: ContentProps) {
  const {
    columns,
    renderCell,
    renderCols,
    data,
    fetchData,
    currentPage,
    isLoading,
    searchKey,
    setSearchKey,
    birdDisclosure,
    freeDisclosure,
    deliverStatusDisclosure,
    confirm,
    changerStatus,
    livreur,
    validateBy,
  } = useContentCtx({ initialData, restaurants });
  
  return (
    <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
      <SearchField searchKey={searchKey} onChange={setSearchKey} />
      <Table aria-label="Example table with dynamic content">
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.uid} align={'start'}>
              {renderCols(column)}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {(data?.content || []).map((row: any) => (
            <TableRow key={row.id}>{(columnKey) => <TableCell>{renderCell(row, columnKey) as React.ReactNode}</TableCell>}</TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
        <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
        <Pagination total={data?.totalPages ?? 1} page={currentPage} onChange={fetchData} showControls color="primary" variant="bordered" isDisabled={isLoading} />
      </div>

      <Modal isOpen={birdDisclosure.isOpen} size={'sm'} onClose={birdDisclosure.onClose}>
        <ModalContent>
          <>
            <ModalHeader className="text-sm">Changer le statut du livreur</ModalHeader>
            <ModalBody>
              <div className="flex justify-around">
                <Button color="primary" size="sm" variant="light" onPress={changerStatus}>
                  Dévenir un bird
                </Button>
                <Button color="danger" size="sm" variant="light" onPress={freeDisclosure.onOpen}>
                  Devenir un liveur assigné
                </Button>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" onPress={birdDisclosure.onClose} size="sm">
                Annuler
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
      {livreur && <DeliveryMenStatusValidate deliveryMan={livreur} open={deliverStatusDisclosure.isOpen} setOpen={deliverStatusDisclosure.onOpenChange} validateBy={validateBy} />}
      <UpdateDeliveryDialog onClose={freeDisclosure.onClose} isOpen={freeDisclosure.isOpen} livreur={livreur} typeLiveur="TURBO" restaurants={restaurants} />
      <ConfirmDialog {...confirm} />
    </div>
  );
}
