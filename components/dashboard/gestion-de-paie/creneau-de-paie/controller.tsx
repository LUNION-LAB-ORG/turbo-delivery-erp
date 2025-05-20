import { GainHebdomadaireVm, GainVm } from "@/types/gestion-de-paie.model";
import { useEffect, useState } from "react";

export function useCreneauDePaieController(gainsHedomadaires?: GainHebdomadaireVm) {
    const [daySelected, setDaySelected] = useState("Lundi");
    const [gainParJours, setGainParJours] = useState<GainVm[]>([]);

    useEffect(() => {
        const filterData = gainsHedomadaires && gainsHedomadaires.gains?.filter((item) =>
            item.jour?.toLocaleLowerCase().includes(daySelected)) || []
        setGainParJours(filterData)
    }, [daySelected, gainsHedomadaires])

    const creneaux = [
        {
            id: 1,
            dateHeure: "2022-01-01 08:00",
            ticket: "#685475",
            coutLivraison: 17000,
            commission: 200000
        },
        {
            id: 2,
            dateHeure: "2022-01-01 10:00",
            ticket: "#14258566",
            coutLivraison: 15000,
            commission: 3200
        },
        {
            id: 3,
            dateHeure: "2022-01-01 12:00",
            ticket: "#9586",
            coutLivraison: 20800,
            commission: 4250
        },
        {
            id: 4,
            dateHeure: "2022-01-01 14:00",
            ticket: "#756498",
            coutLivraison: 18500,
            commission: 3800
        },
        {
            id: 5,
            dateHeure: "2022-01-01 16:00",
            ticket: "#548523",
            coutLivraison: 21500,
            commission: 5400
        }
    ]
    return {
        daySelected,
        setDaySelected,

        gainParJours
    }
}