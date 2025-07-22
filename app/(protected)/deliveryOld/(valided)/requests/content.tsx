'use client';
import { Button } from '@/components/ui/button';
import { Check, XIcon } from 'lucide-react';
import React from 'react';
import { useDemandeAssignationController } from './useDemandeAssignationController';
import { SearchField } from '@/components/commons/form/search-field';
import { DemandeAssignationVM, Restaurant } from '@/types/models';
import ValidateDialog from '@/components/commons/validate-dialog';
import { ConfirmDialog } from '@/components/commons/confirm-dialog';
import EmptyDataTable from '@/components/commons/EmptyDataTable';

export default function Content({ demandeAssignations, allRestaurant }: { demandeAssignations: DemandeAssignationVM[]; allRestaurant: Restaurant[] }) {
  const demandeCtrl = useDemandeAssignationController(demandeAssignations);
  return (
    <div className="container mx-auto p-6 pt-0 flex-wrap">
      <SearchField searchKey={demandeCtrl.selectValue} onChange={demandeCtrl.setSelectValue} />
      <div className="bg-white rounded-lg overflow-x-auto lg:overflow-hidden xl:overflow-hidden md:overflow-x-auto ms:overflow-x-auto">
        <table className="min-w-full border-collapse w-full">
          <tbody>
            {demandeCtrl.data.length === 0 ? (
              <div className="text-center mt-10 text-xl text-primary font-bold">
                <EmptyDataTable title="Aucun Resultat" />
              </div>
            ) : (
              <div>
                {demandeCtrl.data.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-100 flex justify-between">
                    <>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-gray-300"> </span>
                          <span> {item.nomComplet}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{demandeCtrl.recupererStatut(item.statutDemandeAssignation)}</td>
                      <td className="px-6 py-4">{item.date}</td>
                      <td className="px-6 py-4 flex gap-4">
                        {item.type === 'FREE' ? (
                          <Button onClick={() => demandeCtrl.accortder(item)} className="h-8 bg-orange-500">
                            <span className="flex gap-2">
                              <Check size={15} /> Accorder
                            </span>
                          </Button>
                        ) : (
                          <Button variant={'save'} onClick={() => demandeCtrl.onOpenDialog(item)} className="h-7">
                            <span className="flex gap-2 items-center">
                              <Check size={15} /> Accepter
                            </span>
                          </Button>
                        )}
                        <span
                          className={`text-white p-1 pb-0 bg-gray-400  rounded-full hover:bg-primary
                                             ${item.statutDemandeAssignation === 'REJETER' ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                          onClick={() => demandeCtrl.retirer(item.id)}
                        >
                          <XIcon className=" h-5 w-5" />
                        </span>
                      </td>
                    </>
                  </tr>
                ))}
              </div>
            )}
          </tbody>
        </table>
      </div>
      <ValidateDialog
        restaurants={allRestaurant}
        isOpen={demandeCtrl.isOpen}
        onClose={demandeCtrl.onCloseDialog}
        nomComplet={demandeCtrl.nomComplet}
        setRestaurantId={demandeCtrl.setRestaurantSelectId}
        valider={demandeCtrl.valider}
        rejeter={demandeCtrl.rejeter}
        demandeAssignationId={demandeCtrl.demandeAssignationId}
      />
      <ConfirmDialog {...demandeCtrl.confirm} />
    </div>
  );
}
