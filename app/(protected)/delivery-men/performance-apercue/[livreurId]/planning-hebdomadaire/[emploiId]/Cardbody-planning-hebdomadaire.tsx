import { StatutHeure } from "@/types/performance-hebdomadaire";
import React from "react";
import { columns, HourKey } from "./columns";

interface Props {
  initialData: Heure[];
}

const statutHeures: StatutHeure[] = ["NON_DEMARRE", "TRAVAILLE", "HORS_SERVICE", "ABSENT"];

function isStatutHeure(value: string): value is StatutHeure {
  return statutHeures.includes(value as StatutHeure);
}


function mapHeuresToColumns(heures: Heure[]): Record<HourKey, StatutHeure | null> {
  const map: Record<HourKey, StatutHeure | null> = {} as Record<HourKey, StatutHeure | null>;

  // Initialiser chaque colonne à null
  columns.forEach(col => {
    map[col.key] = null;
  });

  heures.forEach(h => {
    const hour = h.debut.slice(0, 2); // "08:00:00" → "08"
    
    if (isStatutHeure(h.statut) && map.hasOwnProperty(hour)) {
      map[hour as HourKey] = h.statut;
    }
  });

  return map;
}


const CardBodyPlanningHebdomadaire: React.FC<Props> = ({ initialData }) => {
  
  const heuresMap = mapHeuresToColumns(initialData);


  const statusColor = (statut: StatutHeure | null) => {
    switch (statut) {
      case "TRAVAILLE":
        return "bg-green-500 text-white";
      case "ABSENT":
        return "bg-red-500 text-white";
      case "HORS_SERVICE":
        return "bg-yellow-500 text-black";
      case "NON_DEMARRE":
        return "bg-gray-400 text-white";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="py-4">
    <div className="w-full flex  ggap-2 ">
      {columns.map(col => (
        <div key={col.key} className="flex flex-col items-center ggap-4">
          <span className="w-14 text-sm">{col.label}</span>
          <span
            className={`text-sm px-2 py-1 roundedd ${statusColor(heuresMap[col.key])}`}
          >
            {heuresMap[col.key] || "—"}
          </span>
        </div>
      ))}
    </div>
    </div>
  );
};

export default CardBodyPlanningHebdomadaire;
