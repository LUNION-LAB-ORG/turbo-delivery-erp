import { Chip, useDisclosure } from "@heroui/react";
import { useEffect, useState } from "react";
import { CircleCheckBig, Minus } from "lucide-react";
import { InfoParJour, PaieErpVM, PaieParLivreur } from "@/types/gestion-de-paie.model";
import { JourTravaille } from "@/types/creneau-bird";

export function useTableauDePaiController(initialData: PaieErpVM | null, searchKey?: string) {
    const [data, setData] = useState<PaieParLivreur[]>(initialData?.paies || [])
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [details, setDetails] = useState<PaieParLivreur>();
    const [nonEligible, setNonEligible] = useState<boolean>(false);

    useEffect(() => {
        if (searchKey && initialData) {
            const newData = initialData?.paies?.filter((item) =>
                item?.nomComplet?.toLowerCase().includes(searchKey.toLocaleLowerCase()));
            if (newData) {
                setData(newData)
            } else {
                setData([])
            }

        } else {
            setData(initialData?.paies || [])
        }
    }, [searchKey, initialData])

    const getStatusChip = (status?: string) => {
        switch (status) {
            case "FREE":
                return <Chip className="bg-primary/10 text-primary" size="sm">Bird</Chip>;
            case "TURBO":
                return <Chip className="bg-yellow-100 text-yellow-500" size="sm">Assigné</Chip>;
            case "WAITING":
                return <Chip className="bg-gray-100 text-gray-500" size="sm">En attente</Chip>;
            default:
                return null;
        }
    };
    const conditionValidation = (items: PaieParLivreur) => {
        const isNotValid = !items?.joursTravaille?.map(((item: InfoParJour) => item.statut)).includes("VALIDE");
        const isNotValidWeekend = !items?.weekEnd?.map((item: InfoParJour) => item.statut).includes("VALIDE");
        switch (isNotValidWeekend) {
            case false:
                return <div className="flex"><CircleCheckBig size={20} />
                    {isNotValid && <span className="text-primary z-[40] -ml-2 -mt-2 text-3xl">*</span>}
                </div>;
            case true:
                return <Minus size={20} />;
            default: return "test"
        }
    }
    const openDetailModal = (item: PaieParLivreur) => {
        const isNotValid = !item?.joursTravaille?.map(((item: any) => item.isWorking)).includes("VALIDE");
        setNonEligible(isNotValid)
        setDetails(item);
        onOpen();
    }

    const recupererStatutJours = (jours?: InfoParJour) => {
        if (jours && jours.statut === "VALIDE") {
            return <Chip className={`bg-yellow-400 mr-1 text-white`} size="sm" >{jours?.jour?.charAt(0).toUpperCase()}</Chip>
        } else {
            return <Chip className={`bg-primary/70 mr-1 text-white`} size="sm" >{jours?.jour?.charAt(0).toUpperCase()}</Chip>
        }
    }

    const recupererStatutJoursWeekend = (weekend?: InfoParJour) => {
        if (weekend && weekend.statut === "VALIDE") {
            return <Chip className={`bg-green-500 mr-1 text-white`} size="sm" >{weekend?.jour?.charAt(0).toLowerCase()}</Chip>
        } else {
            return <Chip className={`bg-gray-300 mr-1 text-white`} size="sm" >{weekend?.jour?.charAt(0).toLowerCase()}</Chip>
        }
    }
    return {
        isOpen,
        openDetailModal,
        onClose,
        details,
        conditionValidation,
        getStatusChip,
        nonEligible,
        data,
        recupererStatutJours,
        recupererStatutJoursWeekend
    }
}