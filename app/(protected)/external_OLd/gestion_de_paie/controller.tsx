
import { useEffect, useState } from "react";
import moment from "moment";
import { allMonthMap } from "@/utils/date-formate";
import { getFicheDePaies } from "@/src/actions/gestion-de-paie.actions";
import { PaieErpVM } from "@/types/gestion-de-paie.model";


export const dayOfWeek = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche"

]


type JourTravailGroupe = Record<string, { nomComplet: string; statut: string }[]>;

export function useGestionPaieController(initialData: PaieErpVM | null) {
    const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
    const [periodes, setPeriodes] = useState<string[]>([]);
    const [MoisEnCours, setMoisEnCours] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<any>();
    const [endDate, setEndDate] = useState<any>();
    const [periode, setPeriode] = useState<string>("");
    const [datas, setDatas] = useState<PaieErpVM | null>(initialData);
    const [joursTravailgroupes, setJourTravailGroupes] = useState<JourTravailGroupe>({});
    const [intervalSelectionnee, setIntervalleSelectionnee] = useState<number[]>([]);
    const [filtrer, setFiltrer] = useState(false)

    const fetchFichePaie = async () => {
        try {
            const result = await getFicheDePaies(startDate, endDate);
            setDatas(result)
        } catch (error) { }
    }

    useEffect(() => {
        filtrer && fetchFichePaie()
    }, [endDate, startDate])

    //Méthode pour obtenir les semaine des l'années
    const obtenirSemaines = (year: number) => {
        const semaines: string[] = [];
        const startDate = new Date(year, 0, 1);
        const today = new Date();
        let current = startDate;
        while (current <= today) {
            const start = new Date(current);
            const end = new Date(current);
            end.setDate(end.getDate() + 6);

            const format = (date: Date) =>
                `${date.getDate().toString().padStart(2, '0')} ${date.toLocaleString("fr-FR", { month: "short" })}`;

            semaines.push(`${format(start)} - ${format(end)}`);
            current.setDate(current.getDate() + 7);
        }
        setPeriodes(semaines);
        const periode = semaines[selectedPeriodIndex];
        periode && parsePeriodStringToDates(periode);
    }


    //Méthode pour groupé les jours de travail par jour unique
    const regrouperJoursTravailParJour = () => {
        const joursRegroupes: JourTravailGroupe = {};
        if (datas && datas?.paies) {
            for (const data of datas?.paies) {
                if (data?.joursTravaille) {
                    for (const jourTravail of data?.joursTravaille) {
                        const { jour, statut } = jourTravail;
                        if (jour) {
                            if (!joursRegroupes[jour]) {
                                joursRegroupes[jour] = [];
                            }
                            joursRegroupes[jour].push({
                                nomComplet: data.nomComplet ?? "",
                                statut: statut ?? ""
                            });
                        }

                    }
                }
                if (data?.weekEnd) {
                    for (const weekEnd of data?.weekEnd) {
                        const { jour, statut } = weekEnd;
                        if (jour) {
                            if (!joursRegroupes[jour]) {
                                joursRegroupes[jour] = [];
                            }
                            joursRegroupes[jour].push({
                                nomComplet: data.nomComplet ?? "",
                                statut: statut ?? ""
                            });
                        }

                    }
                }
            }
            setJourTravailGroupes(joursRegroupes)
        }

    }

    useEffect(() => {
        obtenirSemaines(new Date().getFullYear());
        regrouperJoursTravailParJour();
        const periode = periodes[selectedPeriodIndex];
        periode && setPeriode(periode);
    }, []);

    //Méthode pour obtenir les jours du mois courant
    const obtenirMois = (start: Date, end: Date) => {
        const startMonth = start.getMonth();
        const endMonth = end.getMonth();
        const year = start.getFullYear();
        const month = startMonth !== endMonth ? endMonth : startMonth
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: string[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i.toString().padStart(2, '0'));
        }
        setMoisEnCours(days)

    }


    //Méthode pour transformer la periode selectionnée en date
    const parsePeriodStringToDates = (period: string) => {
        const [startStr, endStr] = period.split(" - ");
        const [startDayStr, startMonthStr] = startStr.split(" ");
        const [endDayStr, endMonthStr] = endStr.split(" ");
        const startMonth = allMonthMap[startMonthStr.toLowerCase()];
        const endMonth = allMonthMap[endMonthStr.toLowerCase()];
        const year = moment(new Date()).format("YYYY");
        const startDate = new Date(Number(year), startMonth, parseInt(startDayStr));
        const endDate = new Date(Number(year), endMonth, parseInt(endDayStr));
        genererIntervalle(parseInt(startDayStr), parseInt(endDayStr), startMonth, Number(year))
        obtenirMois(startDate, endDate)
        setStartDate(startDate);
        setEndDate(endDate);

    }

    //Recuperer la période juste après selection
    useEffect(() => {
        const periode = periodes[selectedPeriodIndex];
        if (periode) {
            parsePeriodStringToDates(periode);
            setPeriode(periode);
            setFiltrer(true)
        }
    }, [selectedPeriodIndex]);


    //Méthode recuperer tout les jours qui ont été validé
    const joursDeTravailsValides = (jour: number): boolean => {
        if (intervalSelectionnee && intervalSelectionnee.includes(jour)) {
            const indexDay = intervalSelectionnee?.findIndex((item) => item === jour)
            switch (indexDay) {
                case 0:
                    return joursTravailgroupes["LUNDI"]?.map((item) => item.statut).includes("VALIDE")
                case 1:
                    return joursTravailgroupes["MARDI"]?.map((item) => item.statut).includes("VALIDE")
                case 2:
                    return joursTravailgroupes["MERCREDI"]?.map((item) => item.statut).includes("VALIDE")
                case 3:
                    return joursTravailgroupes["JEUDI"]?.map((item) => item.statut).includes("VALIDE")
                case 4:
                    return joursTravailgroupes["VENDREDI"]?.map((item) => item.statut).includes("VALIDE")
                case 5:
                    return joursTravailgroupes["SAMEDI"]?.map((item) => item.statut).includes("VALIDE")
                case 6:
                    return joursTravailgroupes["SAMEDI"]?.map((item) => item.statut).includes("VALIDE")
                default: {
                    return false;
                }
            }
        }
        return false
    }

    const genererIntervalle = (debut: number, fin: number, mois: number, annee: number) => {
        const result: number[] = [];
        const dernierJour = new Date(annee, mois, 0).getDate();
        let jour = debut;
        while (true) {
            result.push(jour);
            if (jour === fin) break;
            jour += 1;
            if (jour > dernierJour) {
                jour = 1;
                result.splice(0, result.length)
            }
        }
        setIntervalleSelectionnee(result);
    };


    const handlePrevious = () => {
        setSelectedPeriodIndex((prev) => (prev > 0 ? prev - 1 : periode.length - 1));
    };

    const handleNext = () => {
        setSelectedPeriodIndex((prev) => (prev < periode.length - 1 ? prev + 1 : 0));
    };

    const [searchKey, setSearchKey] = useState("");

    const handleChange = (event: any) => {
        setSearchKey(event.target.value);
    }
    return {
        periode,
        dayOfWeek,
        searchKey,
        handleChange,
        handlePrevious,
        handleNext,
        selectedPeriodIndex,
        setSelectedPeriodIndex,
        setSearchKey,
        periodes,
        MoisEnCours,
        datas,
        joursDeTravailsValides,
    }
}