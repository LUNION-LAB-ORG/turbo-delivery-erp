'use client'
import { PaginatedResponse } from "@/types";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import UserListPerformanceBird from "@/components/dashboard/delivery-men/performance/user-list-performance-bird";
import useContentCtx from "./useContentCtx";

interface Props {
      initialData:PaginatedResponse<LivreurPerformanceBirdEndTorubo> | null;
    
}

export default function Content({initialData}:Props){

  console.log({performance:initialData});
  
 
  const {data}=useContentCtx({initialData})


      if(!data||data.length==0){
        return <EmptyDataTable/>
      }

      // const restaurants = data?.content ?? [];
  
    return ( 
        <UserListPerformanceBird data={data}/>
    )
}