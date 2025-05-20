
'use client'

import React, { useState } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    getKeyValue,
  } from "@heroui/react";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import progresseBarePerformance from "@/components/dashboard/delivery-men/performance-creneau/progression-bare-performance";
import DropDownPerformanceCrenea from "@/components/dashboard/delivery-men/performance-creneau/drop-down-performance-creneau";
  

const  progressions= [
          {
            jour: "LUNDI",
            progression: 0,
            heure: 0,
            commission: 0
          },
          {
            jour: "MARDI",
            progression: 0,
            heure: 0,
            commission: 0
          },
          {
            jour: "MERCREDI",
            progression: 0,
            heure: 0,
            commission: 0
          },
          {
            jour: "JEUDI",
            progression: 0,
            heure: 0,
            commission: 0
          }
        ]
const data ={

        jour:"LUNDI",
        progression: 0,
        heure: 0,
        commission:0
 
}
    
  const columns = [
    {
      key: "jour",
      label: "Jour",
    },
    {
      key: "progression",
      label: "Progression du jour",
    },
    {
      key: "commission",
      label: "commission du Jour",
    },
  ];
  
  export default function FakeTableCreneau() {

    const [open, setOpen] = useState<boolean>(false);
        

    const renderCell = React.useCallback((data:Progression, columnKey:any) => {
      // const cellValue = rows[columnKey];

      switch (columnKey) {
        case "jour":
          return (
          <div className="opacity-50">
            {data.jour}
          </div>
          );
        case "progression":
          return (
            <div className="flex gap-2">
                {progresseBarePerformance(data)}
              <span className="opacity-50">A venir</span>
            </div>
          );
        case "commission":
          return (
            <div>
            --
            </div>
          );
        default:
          return null;
      }
    }, []);

    return (
      <div>
          <Table aria-label="Example table with custom cells"  selectionMode="single">
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key}>
            {column.label}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody items={progressions} emptyContent={<EmptyDataTable title="Aucun  Livreur" />}>
        {(item) => (
          <TableRow key={item.jour} onClick={() => setOpen(true)}>
            {(columnKey) => <TableCell  >{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
      </div>
    
    );
  }
