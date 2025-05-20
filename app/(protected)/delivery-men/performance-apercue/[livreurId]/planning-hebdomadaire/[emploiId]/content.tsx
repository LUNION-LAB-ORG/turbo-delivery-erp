'use client'

import ButtonRetour from "@/components/commons/bouton-retour";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import SectionHeaderRetour from "@/components/commons/section-header-retour";
// import TableCreneau from './table-creneau'
import { title } from '@/components/primitives';
import { PerformanceCreneauId } from "@/types/performance-creneauId";
import { Card } from "@heroui/react";
import ListPerformanceApercu from "@/components/dashboard/delivery-men/performance-apercu/list-performance";
import HeaderInfo from "@/components/dashboard/delivery-men/performance-apercu/planning-hebdomadaire/header-info";
import { PerformanceHebdomadaire } from "@/types/performance-hebdomadaire";
import BodyInfo from "@/components/dashboard/delivery-men/performance-apercu/planning-hebdomadaire/body-info";

interface Props {
  data: PerformanceHebdomadaire;

  // PerformanceCreneauId
    
}

export default function Content({data,}:Props){

  console.log(data)
  
    return (
      <>
          <div>
              <div className="flex items-center pb-10">
                <ButtonRetour/>
                <h1 className={title({ size: 'h3', class: 'text-primary' })}>Planning hebdomadaire</h1>
               </div>
                <HeaderInfo data={data} />
                <BodyInfo data={data}/>          
          </div>
      </>
    )
}