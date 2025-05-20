'use client'
import UserListe from "@/components/dashboard/delivery-men/progression/user-liste";
import { BirdPerformance } from "@/types/slot";
import useContentCtx from "./useContentCtx";
import TableCreneau from "./tableCreneau";
import { PaginatedResponse } from "@/types";
import EmptyDataTable from "@/components/commons/EmptyDataTable";


interface props{
  initialData: PaginatedResponse<CreneauProgressionBird> | null
}


export default function Content({initialData}:props){


    const {data}= useContentCtx({initialData})
    
      if(!data||data.length==0){
        return <EmptyDataTable/>
      }
    
   
    return (
        <TableCreneau initialData={data}/>
    //  <UserListe initialData={data} />
    )
}