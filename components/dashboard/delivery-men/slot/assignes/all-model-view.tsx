import { IconLayoutGrid, IconListCheck } from "@tabler/icons-react"
import UserListeModel2 from "../user-liste-model-2"
import UserListeModel1 from "../user-liste-model-1"
import { LivreurBird } from "@/types/creneau-bird"
import EmptyDataTable from "@/components/commons/EmptyDataTable";

interface props{
    value:'list' | 'grid',
    birdCreneau: LivreurBird[],
    setValue: (value: 'list' | 'grid') => void; 
}

export default function AllModelView({value,birdCreneau,setValue}:props){

  if(!birdCreneau||birdCreneau.length==0){
    return <EmptyDataTable/>
  }

     const style1 = 'bg-white flex flex-col gap-1 rounded-lg  overflow-x-auto'
  const style2 = ' grid gap-6 md:grid-cols-2 lg:grid-cols-3'

    return(
        <div className="mb-8  ">
        <div className="flex gap-60 pb-10">
        <h2 className="text-2xl mb-2">Turboys ayant des créneaux</h2>

            <div className="flex gap-2">
              <div>
                  <button type="button" className={`btn btn-outline-primary p-2 ${value === 'list' && 'bg-primary text-white'}`} onClick={() => setValue('list')}>
                      <IconListCheck />
                  </button>
              </div>
              <div>
                  <button type="button" className={`btn btn-outline-primary p-2 ${value === 'grid' && 'bg-primary text-white'}`} onClick={() => setValue('grid')}>
                      <IconLayoutGrid />
                  </button>
              </div>
            </div>
        </div>

      
        <div className={`${value === 'list' && style1}${value === 'grid' && style2} `}>
          {birdCreneau.map((turboy,index) =>{ 
            if(value=='list')  return  <UserListeModel1 key={index} turboy={turboy}/>
            if(value=='grid')  return <UserListeModel2 key={index} turboy={turboy}/>}
          )}
        </div>
      </div>
    )
}