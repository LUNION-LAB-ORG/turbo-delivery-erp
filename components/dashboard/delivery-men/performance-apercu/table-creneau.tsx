
'use client'

import React, {useCallback, useEffect, useState } from "react";
import { TableauProgression } from './tableau-progression';
import EtatErreur from "@/components/commons/EtatErreur";
import progresseBarePerformance from "@/components/dashboard/delivery-men/performance-creneau/progression-bare-performance";
import DropDownPerformanceCrenea from "@/components/dashboard/delivery-men/performance-creneau/drop-down-performance-creneau";
import Link from "next/link";
import { CreneauItem } from "@/types/performance-creneauId";
import { getPerformanceFichePaie } from "@/src/performance/performance.action";
import { useParams } from "next/navigation";
import { formatMontant } from '@/utils/format.utils';
  
const performanceApercuGlobalGain: PerformanceApercuGlobalGain|null = {
  solde: 3210.35,
  gains: [
    {
      date: "2025-04-07",
      jour: "LUNDI",
      gain: {
        solde: 420.50,
        gains: [
          { code: "CMD0970", frais: 9.5, commission: 25.0, date: "2025-04-07" },
          { code: "CMD0971", frais: 6.0, commission: 15.5, date: "2025-04-07" },
          { code: "CMD0972", frais: 7.0, commission: 20.0, date: "2025-04-07" }
        ]
      }
    },
    {
      date: "2025-04-08",
      jour: "MARDI",
      gain: {
        solde: 385.75,
        gains: [
          { code: "CMD0973", frais: 8.0, commission: 18.0, date: "2025-04-08" },
          { code: "CMD0974", frais: 10.0, commission: 28.5, date: "2025-04-08" }
        ]
      }
    },
    {
      date: "2025-04-09",
      jour: "MERCREDI",
      gain: {
        solde: 470.60,
        gains: [
          { code: "CMD0975", frais: 7.5, commission: 22.0, date: "2025-04-09" },
          { code: "CMD0976", frais: 12.0, commission: 35.0, date: "2025-04-09" },
          { code: "CMD0977", frais: 5.0, commission: 12.5, date: "2025-04-09" }
        ]
      }
    },
    {
      date: "2025-04-10",
      jour: "JEUDI",
      gain: {
        solde: 375.50,
        gains: [
          { code: "CMD0978", frais: 10.0, commission: 27.5, date: "2025-04-10" },
          { code: "CMD0979", frais: 5.5, commission: 13.0, date: "2025-04-10" },
          { code: "CMD0980", frais: 8.0, commission: 20.0, date: "2025-04-10" }
        ]
      }
    },
    {
      date: "2025-04-11",
      jour: "VENDREDI",
      gain: {
        solde: 610.25,
        gains: [
          { code: "CMD0981", frais: 15.0, commission: 40.0, date: "2025-04-11" },
          { code: "CMD0982", frais: 8.0, commission: 20.0, date: "2025-04-11" },
          { code: "CMD0983", frais: 6.5, commission: 15.0, date: "2025-04-11" },
          { code: "CMD0984", frais: 9.0, commission: 22.75, date: "2025-04-11" }
        ]
      }
    },
    {
      date: "2025-04-12",
      jour: "SAMEDI",
      gain: {
        solde: 450.00,
        gains: [
          { code: "CMD0985", frais: 10.5, commission: 25.0, date: "2025-04-12" },
          { code: "CMD0986", frais: 7.0, commission: 17.5, date: "2025-04-12" },
          { code: "CMD0987", frais: 12.0, commission: 30.0, date: "2025-04-12" }
        ]
      }
    },
    {
      date: "2025-04-13",
      jour: "DIMANCHE",
      gain: {
        solde: 497.75,
        gains: [
          { code: "CMD0988", frais: 9.5, commission: 26.0, date: "2025-04-13" },
          { code: "CMD0989", frais: 11.0, commission: 32.0, date: "2025-04-13" }
        ]
      }
    }
  ]
};


  const columns = [
    {
      key: "jour",
      label: "Jour",
    },
    {
      key: "progression",
      label: "Progression du jour",
    },
    {
      key: "commission",
      label: "commission du Jour",
    },
  ];
  
  export default function TableCreneau({initialData}:{initialData:CreneauItem}) {
    const [jour,SetJour]=useState<string>()
    const [dataGains,setDataGains]=useState<PerformanceApercuGlobalGain|null>()
    const rawParams = useParams();
    const livreurId = Array.isArray(rawParams.livreurId)
      ? rawParams.livreurId[0]
      : rawParams.livreurId;

    const [open, setOpen] = useState<boolean>(false);

    const emploiId= initialData.creneau.emploiId
        
    // Echec de lecture de la fiche de paie du creneau. Sans cet etat, le detail du
    // jour s'ouvrait vide et se lisait comme « aucun gain » alors que la lecture
    // avait echoue.
    const [erreurGains, setErreurGains] = useState<boolean>(false);
    const [chargementGains, setChargementGains] = useState<boolean>(false);

    const chargerGains = useCallback(async () => {
      if (!livreurId || !emploiId) return; // sécurité
      // Chaque tentative repart d'un etat sain.
      setErreurGains(false);
      setChargementGains(true);
      try {
        const result = await getPerformanceFichePaie(livreurId, emploiId);
        setDataGains(result||null)
      } catch (err) {
        // L'action serveur releve desormais l'exception : on la montre au lieu de
        // la noyer dans la console.
        setErreurGains(true);
        console.error('Erreur lors du fetch :', err);
      } finally {
        setChargementGains(false);
      }
    },[livreurId, emploiId]);

    useEffect(()=>{
      chargerGains();
    },[chargerGains])

    const openJour = (j: string) => {
      setOpen(true);
      SetJour(j);
    };

    return (
      <div className="flex flex-col gap-4">
        {/*
         * Le tableau et la liste de cartes etaient recopies ici comme dans les trois
         * fichiers voisins, avec la meme fonction `renderCell` a `switch` et le meme
         * `aria-label="Example table with custom cells"` — la legende de l'exemple de la
         * documentation HeroUI, annoncee aux lecteurs d'ecran des quatre ecrans.
         */}
        <TableauProgression jours={initialData.progressions ?? []} onJour={(j) => openJour(j.jour)} />

        {/* L'echec prend la place du detail des gains : ouvrir un panneau vide se
            lirait comme une journee sans gain. */}
        {erreurGains ? (
          <EtatErreur
            enCours={chargementGains}
            onReessayer={chargerGains}
            quoi="le détail des gains du créneau"
          />
        ) : (
          <DropDownPerformanceCrenea
            gainsData={dataGains || null}
            jour={jour}
            open={open}
            setOpen={setOpen}
          />
        )}
      </div>
    );
  }
