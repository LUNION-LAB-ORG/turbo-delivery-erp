// import { Livreur } from "@/types/creneau-bird"
import { BirdPerformance } from "@/types/slot";
import { Progress } from "@heroui/react"

// :{turboys:Livreur}
  const progresseBare2 =(turboys:CreneauProgressionBird)=>{

            if(turboys.progression==100){
            return <Progress label={turboys.progression +'%'}   color="success" className="max-w-md"  value={100} />
            }
            if(turboys.progression<100 && turboys.progression>=65){
                return <Progress label={turboys.progression +'%'}   color="warning" className="max-w-md"  value={65} />
                }
            if(turboys.progression<65){
                
                return <Progress label={turboys.progression +'%'}   color="danger" className="max-w-md"  value={20} />
                }
          

              return 'null'

        }

        
        


export default progresseBare2