'use client'
import UserListe from "@/components/dashboard/delivery-men/progression/user-liste";
import { BirdPerformance } from "@/types/slot";
import useContentCtx from "./useContentCtx";
import TableCreneau from "./tableCreneau";
import { PaginatedResponse } from "@/types";
import EmptyDataTable from "@/components/commons/EmptyDataTable";

interface props{
  initialData: PaginatedResponse<RestaurantProgressionTurbo> | null
}

export default function Content({initialData}:props){

  const {turboysAssignes}=useContentCtx({initialData})


  console.log(turboysAssignes);
  

  if(!turboysAssignes||turboysAssignes.length==0){
    return <EmptyDataTable/>
  }


 
  return (

    <div className="flex flex-col gap-4">
      {
       turboysAssignes.map((item,index)=>(
        <div key={index} className="border rounded-xl">
           <h2 className="py-4 px-4 text-xl">{item.nomRestaurant}</h2>
           <TableCreneau initialData={item.livreurs}/>

        </div>)

      ) 
      }
    </div>
    
        // <TableCreneau initialData={initialData}/>
    //  <UserListe initialData={data} />
    )

 
  
}