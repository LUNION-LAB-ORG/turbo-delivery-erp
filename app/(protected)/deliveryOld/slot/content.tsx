'use client'
import { PaginatedResponse } from "@/types";
import { LivreurBird } from "@/types/creneau-bird";
import { Card } from "@heroui/react";
import useContentCtx from "./useContentCtx";
import { useState } from "react";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import AllModelView from "@/components/dashboard/delivery-men/slot/assignes/all-model-view";
import AllModelViewNotCreneau from "@/components/dashboard/delivery-men/slot/bird/all-model-view";


interface Props {
      initialData:PaginatedResponse<LivreurBird> | null;
    
}

export default function Content({initialData}:Props){
  const [value, setValue] = useState<'list' | 'grid'>('list');

 
  const {birdCreneau,birdNotCreneau}=useContentCtx({initialData})

  console.log({birdCreneau:birdCreneau});

      if(!birdCreneau||birdCreneau.length==0){
        return <EmptyDataTable/>
      }

      // const restaurants = data?.content ?? [];
  
    return (
        <Card className="p-4 bbg-gray-100 min-h-screen">
        
        <AllModelView value={value} setValue={setValue} birdCreneau={birdCreneau} />

        <AllModelViewNotCreneau value={value} setValue={setValue} birdNotCreneau={birdNotCreneau} />
           
      </Card>
    )
}