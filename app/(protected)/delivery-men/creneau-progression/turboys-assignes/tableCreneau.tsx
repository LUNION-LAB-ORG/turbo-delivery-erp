'use client'

import React from "react";

import { BirdPerformance } from "@/types/slot";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    getKeyValue,
  } from "@heroui/react";
import useContentCtx from "./useContentCtx";
import progresseBare2 from "@/components/dashboard/delivery-men/progression/progression-barre2";
import { PaginatedResponse } from "@/types";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
  
const bird = [
  {
    id: "1a2b3c4d-1234-5678-9101-abcdefabcdef",
    nomComplet: "Jean Dupont",
    progression: 75,
    jour: {
      jourTravaille: 15,
      jourNonTravaille: 5
    },
    creneauVM: {
      debut: "2025-04-01",
      fin: "2025-04-15"
    }
  },
  {
    id: "1a2b3c1d-1234-5678-9101-abcdefabcdef",
    nomComplet: "Jean Dupont",
    progression: 65,
    jour: {
      jourTravaille: 5,
      jourNonTravaille: 2
    },
    creneauVM: {
      debut: "2025-04-11",
      fin: "2025-04-15"
    }
  },
  {
    id: "1a2b3c1d-1234-5678-9109-abcdefabcdef",
    nomComplet: "Jean Dupont",
    progression: 50,
    jour: {
      jourTravaille: 5,
      jourNonTravaille: 2
    },
    creneauVM: {
      debut: "2025-04-11",
      fin: "2025-04-16"
    }
  },
  
 
];



  const rows = [
    {
      key: "1",
      name: "Tony Reichert",
      role: "CEO",
      status: "Active",
    },
    {
      key: "2",
      name: "Zoey Lang",
      role: "Technical Lead",
      status: "Paused",
    },
    {
      key: "3",
      name: "Jane Fisher",
      role: "Senior Developer",
      status: "Active",
    },
    {
      key: "4",
      name: "William Howard",
      role: "Community Manager",
      status: "Vacation",
    },
  ];
  
  const columns = [
    {
      key: "nom",
      label: "Nom du coursier",
    },
    {
      key: "progression",
      label: "Progression",
    },
    {
      key: "jours",
      label: "Jours",
    },
    {
      key: "debut",
      label: "Début",
    },
    {
      key: "fin",
      label: "Fin",
    },
  ];

  interface props{
    initialData: Livreur[]    
  }
  
  export default function TableCreneau({initialData}:props) {
        

    const renderCell = React.useCallback((data:Livreur, columnKey:any) => {
      const cellValue = rows[columnKey];

      switch (columnKey) {
        case "nom":
          return (
          <div >
            {data.nomComplet??'Nom du coursier non definie'}
          </div>
          );
        case "progression":
          return (
            <div className="flex flex-col">
              { progresseBare2(data)}
            </div>
          );
        case "jours":
          return (
            <div>
               {/* `${data.jour.jourNonTravaille}/7` */}
              {data.jour ? `${data.jour.jourTravaille}/7`:'Jour non definie'}
            </div>
          );
          case "debut":
            return (
              <div>
                {data.creneauVM?.jourDebut??'Jour non definie'}
              </div>
            );
            // {
            //   if(!data||data.jour||data.jour&&data.jour.jourNonTravaille)
            //   return (
            //     <div>
            //       {data.creneauVM.debut}
            //     </div>
            //   );

            // }
         
          case "fin":
            return (
              <div>
                {data.creneauVM?.jourFin??'creneauVM non definie'}
              </div>
            );
  
        default:
          return null;
      }
    }, []);


    return (
      <Table aria-label="Example table with custom cells">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={initialData}  emptyContent={<EmptyDataTable title="Aucun  Livreur" />}>
        {(item) => (
          <TableRow key={String(item.id)}>
            {(columnKey) => <TableCell className="w-1/5">{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
    );
  }
  