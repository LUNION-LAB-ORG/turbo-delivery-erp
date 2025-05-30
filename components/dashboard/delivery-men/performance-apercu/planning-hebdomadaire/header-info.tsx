import { PerformanceHebdomadaire } from "@/types/performance-hebdomadaire";


export default function HeaderInfo({data}:{data:PerformanceHebdomadaire}) {
  return (
    <div className=" flex justify-between   border-2 p-4 px-10 rounded-lg">
     <div className="">
        <h2>Nombre d&apos;heure de travail</h2>
        <p className="text-xl">{data.heureTravailParCreneau}</p>
        <h3>sur 7 jours de la semaine</h3>
      </div>

      <div className="">
        <h2>Nombre d&apos;arrêt de travail</h2>
        <p className="text-xl">{data.heureArret}</p>
        <h3>sur 7 jours de la semaine</h3>
      </div>

      <div className="">
        <h2>Jour manqué</h2>
        <p className="text-xl">{data.jourManque}</p>
        <h3>sur 7 jours de la semaine</h3>
      </div>
    </div>
   
  );
}
