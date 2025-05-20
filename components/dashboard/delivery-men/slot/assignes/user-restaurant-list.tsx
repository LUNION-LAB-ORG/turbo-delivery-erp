import { Restaurant } from "@/types/creneau-turbo";
import progresseBare from "../../progression/progression-barre";
import { IconPointFilled } from "@tabler/icons-react";
import DropDownAction from "../dropDownAction";
import EmptyDataTable from "@/components/commons/EmptyDataTable";
import { Avatar } from "@heroui/react";
import createUrlFile from "@/utils/createUrlFile";



export default function UserRestaurantListe({turboysCreneau}:{turboysCreneau:Restaurant[]}){

    if(!turboysCreneau||turboysCreneau.length==0){
        return(  
            <div>
               <h2 className="text-lg font-semibold mb-2">Turboys ayant des créneaux</h2>
                <EmptyDataTable/>
            </div>
            )
      }


    return (
        <div className="relative mb-6  text-slate-500">
        <div className="relative mb-6 ">
        <h2 className="text-lg font-semibold mb-2">Turboys ayant des créneaux</h2>
        <div className="relative bg-white flex items-center flex-col gap-1 rounded-lg  overflow-auto">
       
       { turboysCreneau.map((restaurant, index) => {
          return (
            <div key={index} className="w-full  flex gap-4  border-2 rounded-2xl">
              <div className="relative w-[230px]">
                <div className=" flex items-center px-2 pt-3">
                  <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                  {restaurant.nomRestaurant}
                </div>
                <p className="text-center text-2xl font-semibold"  >{restaurant.nombreLivreur}</p>
              </div>

              <div className="flex-grow border-l-2 ">
                <div className="flex flex-col py-2">
                  {/* <Avatar isBordered radius="full" size="md" src={undefinedRestaurant.logo_Url} /> */}

                  { restaurant.livreurs.map((child, index) => {
                    return (
                      <div key={index}  className='font-semibold flex items-center px-3 py-4'>
                        <div className="w-10">
                        <Avatar isBordered radius="full" size="md" src={createUrlFile(child?.avatar ?? '', "backend")}/>
                          
                          {/* <div className=" w-10 h-10 bg-gray-300 rounded-full mr-3"></div> */}
                        </div>
                        <p className="w-2/6 text-lg px-2" key={index}>
                          {child.nomComplet}
                        </p>
                        <p className="w-1/5 px-2" key={index}>
                          <span className="pr-1">Inscrit le :</span>  <span className="text-gray-600">{child.dateInscrit}</span>
                        </p>
                        <p className="w-1/5 px-2" key={index}>
                        <span className="pr-1">Defini le: </span>  <span className="text-gray-600"> {child.dateDefiniEmploiTemps}</span>              
                        </p>
          
                        <div className="relative w-2/5 px-2 flex items-center justify-between ">
                        {progresseBare(child)}
                        <span className="flex items-end mt-6">
                          {child.disponibilite?<IconPointFilled color="#16B84E" size={30} />:<IconPointFilled color="#FF0000" size={30} />}
                        </span>
                        </div>
                        <div className="px-2">
                          <DropDownAction id={child.id} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })
      }
    </div>
      </div>

       
      </div>
      
    )
}