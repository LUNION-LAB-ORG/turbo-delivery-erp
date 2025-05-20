import {Transition, Dialog, DialogPanel, TransitionChild } from "@headlessui/react";
import { Button, Card, CardHeader, CardBody, CardFooter} from "@heroui/react";
import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import React, { Fragment, useEffect, useState } from 'react';
import TableCreneauDetail from "../performance-apercu/table-creneau-detail";

interface props{
    open: boolean,
     setOpen: (open: boolean) => void,
     gainsData: PerformanceApercuGlobalGain|null,
     jour: string|undefined,
}



export default function DropDownPerformanceCrenea({open,setOpen,gainsData,jour}:props) {
   
    const [currentIndex, setCurrentIndex] = useState(0);

    const[data,setData]=useState<JourGain|null>(gainsData?.gains[0]||null)

    // {gainsData: PerformanceApercuGlobalGain|null,jour:string|undefined}

    useEffect(()=>{

        function jourDeLaSemaine(jour:string|undefined) {
            switch (jour) {
              case "LUNDI":
                return 0;
              case "MARDI":
                return 1;
              case "MERCREDI":
                return 2;
              case "JEUDI":
                return 3;
              case "VENDREDI":
                return 4;
              case "SAMEDI":
                return 5;
              case "DIMANCHE":
                return 6;
              default:
                return 0;
            }
          }

          setCurrentIndex(jourDeLaSemaine(jour))        

    },[gainsData,jour])



//  const[data,setData]=useState<JourGain|null>(curentItemClick({gainsData,jour})||null)



//  console.log({gainsDataaa:gainsData});
 

 
 const handleNext = () => {
    if (gainsData && gainsData.gains.length > 0) {
        setCurrentIndex((prevIndex) =>
          prevIndex < gainsData.gains.length - 1 ? prevIndex + 1 : prevIndex
        );

      }
  };

  const handlePrev = () => {
    if (gainsData && gainsData.gains.length > 0) {
        setCurrentIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex
        );
      }
  };

    useEffect(()=>{
        if(gainsData)
            setData(gainsData.gains[currentIndex])        
    },[gainsData,currentIndex])


// if(data)

  return (
     <Transition appear show={open} as={Fragment} >
              <Dialog as="div" open={open} onClose={() => setOpen(false)} className="relative z-50 ">
                  <TransitionChild as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                      <div className="fixed inset-0 bg-[black]/60" />
                  </TransitionChild>
                  <div className="fixed inset-0 overflow-y-auto">
                      <div className="flex min-h-full items-center justify-center px-4 py-8">
                          <TransitionChild
                              as={Fragment}
                              enter="ease-out duration-300"
                              enterFrom="opacity-0 scale-95"
                              enterTo="opacity-100 scale-100"
                              leave="ease-in duration-200"
                              leaveFrom="opacity-100 scale-100"
                              leaveTo="opacity-0 scale-95"
                          >
                              <DialogPanel className="panel w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                  <button
                                      type="button"
                                      onClick={() => setOpen(false)}
                                      className="absolute top-4 text-gray-400 outline-none hover:text-gray-800 ltr:right-4 rtl:left-4 dark:hover:text-gray-600"
                                  >
                                      <IconX />
                                  </button>
                                    <Card className="py-4 w-full ">
                                    <CardHeader className="pb-0 pt-2 px-4 flex-col ">
                                        <p className="text-tiny uppercase font-bold"> {data?.date}</p>                                   
                                    </CardHeader>
                                    <CardBody className="overflow-visible pt-5 flex items-center">
                                        <div className="bg-slate-300  flex items-center rounded-lg">
                                        <Button onClick={handlePrev} size="sm"><IconChevronLeft stroke={2} /></Button>
                                       {data?.jour}

                                        <Button  onClick={handleNext} size="sm" ><IconChevronRight stroke={2} /></Button>
                                          
                                        </div>

                                       <TableCreneauDetail initialData={data?.gain.gains|| []}/>
                                    </CardBody>
                                    <CardFooter className="py-5 flex justify-center">
                                         <Button size="sm" >imprimer</Button>

                                    </CardFooter>
                                    </Card>                                         
                              </DialogPanel>
                          </TransitionChild>
                      </div>
                  </div>
              </Dialog>
          </Transition>
  );
}
