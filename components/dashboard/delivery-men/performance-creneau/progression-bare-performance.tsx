// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";
import { Progress } from "@heroui/react"

// :{turboys:Livreur}
  const progresseBarePerformance =(item:Progression)=>{

            if(item.heure==8){
            return <Progress   color="success" className="max-w-[100px]"  value={100} />
            }
            if(item.heure==7){
                return <Progress    color="warning" className="max-w-[100px]"  value={85} />
                }
            if(item.heure<7&& item.heure>0 ){
              return <Progress    color="warning" className="max-w-[100px]"  value={item.progression} />
              }
            if(item.heure==0){
                
                return <Progress   color="danger" className="max-w-[100px]"  value={5} />
                }

          

              return <Progress   color="danger" className="max-w-[100px]"  value={0} />

        }

        
        


export default progresseBarePerformance