// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";
import { CircularProgress, Progress } from "@heroui/react"

// :{turboys:Livreur}
  const fnProgressionPerformance =(item:LivreurPerformanceBirdEndTorubo)=>{

            if(item.performance<=35){
                return <CircularProgress color="danger" showValueLabel={true} size="lg" value={item.performance} />

                }
            if(item.performance>35&&item.performance<=70){
                return <CircularProgress color="warning" showValueLabel={true} size="lg" value={item.performance} />

                }
            if(item.performance=100){
                return <CircularProgress color="success" showValueLabel={true} size="lg" value={item.performance} />

                }
          
              return 'null'

        }

        
        


export default fnProgressionPerformance