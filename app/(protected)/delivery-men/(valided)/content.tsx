'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from '@heroui/react';

import useContentCtx from './useContentCtx';
import { PaginatedResponse } from '@/types';
import { LivreurStatutVM, Restaurant } from '@/types/models';
import { SearchField } from '@/components/commons/form/search-field';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import { UpdateDeliveryDialog } from '../update-delivery/update-delivery';
import DeliveryMenStatusValidate from '@/components/dashboard/delivery-men/delivery-men-status-validate';

interface ContentProps {
  initialData: PaginatedResponse<LivreurStatutVM> | null;
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

  // Données provenant du backend
  const backendRows = (data?.content || []).filter(Boolean);
  
  // Configuration pour afficher exactement 10 items par page
  const ITEMS_PER_PAGE = 10;
  const totalElements = data?.totalElements || 0;
  
  // Calculer le nombre de pages en s'assurant que chaque page a 10 éléments
  // sauf la dernière qui prend le reste
  const totalPages = Math.ceil(totalElements / ITEMS_PER_PAGE);
  
  // Les données à afficher sont celles reçues du backend
  // Le backend envoie déjà les bonnes données (10 par page sauf dernière page)
  const rows = backendRows;
  
  // Fonction pour gérer le changement de page
  const handlePageChange = (page: number) => {
    fetchData(page);
  };

  // Calculer le nombre d'éléments affichés sur la page actuelle
  const currentPageElements = rows.length;
  const pageNumber = data?.number || 0; // Page actuelle du backend (0-based)
  const startElement = (pageNumber * ITEMS_PER_PAGE) + 1;
  const endElement = startElement + currentPageElements - (pageNumber == 0 ? 0 : 1);

  return (
    <div className="w-full h-full pb-10 flex flex-1 flex-col gap-4">
      <SearchField searchKey={searchKey} onChange={setSearchKey} />

      <Table aria-label="Tableau des livreurs">
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.uid} align="start">
              {renderCols(column)}
            </TableColumn>  
          ))}
        </TableHeader>

        <TableBody emptyContent="Aucun livreur à afficher.">
          {rows.map((row: LivreurStatutVM) => (
            <TableRow key={row.livreurId}>
              {columns.map((column) => (
                <TableCell key={column.uid}>
                  {renderCell(row, column.uid) as React.ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex h-fit z-10 justify-center mt-8 fixed bottom-4">
        <div className="bg-gray-200 absolute inset-0 w-full h-full blur-sm opacity-50"></div>
        <Pagination
          total={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          showControls
          color="primary"
          variant="bordered"
          isDisabled={isLoading}
        />
      </div>

      {/* Affichage des informations de pagination */}
      <div className="text-sm text-gray-600 mt-2 text-center mb-16">
        Page {currentPage} sur {totalPages} 
        ({startElement}-{endElement} sur {totalElements} éléments)
      </div>

      {/* MODAL pour changer le statut */}
      <Modal isOpen={birdDisclosure.isOpen} size="sm" onClose={birdDisclosure.onClose}>
        <ModalContent>
          <>
            <ModalHeader className="text-sm">Changer le statut du livreur</ModalHeader>
            <ModalBody>
              <div className="flex justify-around">
                <Button color="primary" size="sm" variant="light" onPress={changerStatus}>
                  Devenir un bird
                </Button>
                <Button color="danger" size="sm" variant="light" onPress={freeDisclosure.onOpen}>
                  Devenir un livreur assigné
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

      {/* MODAL pour valider un livreur */}
      {livreur && (
        <DeliveryMenStatusValidate
          deliveryMan={livreur}
          open={deliverStatusDisclosure.isOpen}
          setOpen={deliverStatusDisclosure.onOpenChange}
          validateBy={validateBy}
        />
      )}

      {/* MODAL pour affectation d'un livreur libre */}
      <UpdateDeliveryDialog
        onClose={freeDisclosure.onClose}
        isOpen={freeDisclosure.isOpen}
        livreur={livreur}
        typeLiveur="TURBO"
        restaurants={restaurants}
      />

      {/* MODAL de confirmation */}
      <ConfirmDialog {...confirm} />
    </div>
  );
}