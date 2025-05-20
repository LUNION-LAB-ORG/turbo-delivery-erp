// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";
import { Progress } from "@heroui/react"

// :{turboys:Livreur}
  const fnPerformance =(item:LivreurPerformanceBirdEndTorubo)=>{

            if(item.performance<=35){
                return "Faible"
                }
            if(item.performance>35&&item.performance<70){
                return "Moyenne"
                }
            if(item.performance>=70&&item.performance<100){
                return "Assez bien"
                }
            if(item.performance==100){
            return "Bonne"
            }
          
              return 'null'

        }

        
        


export default fnPerformance