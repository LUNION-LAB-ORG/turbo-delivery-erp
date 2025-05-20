import { getFichePaieByEmploiAndLivreur, getFichePaieById } from "@/src/actions/gestion-de-paie.actions";
import { FichePaieDetailVM, GainHebdomadaireVm, GainParJour, GainVm, PaieParLivreur } from "@/types/gestion-de-paie.model";
import { useDisclosure } from "@heroui/react";
import { useEffect, useState } from "react";

export function useInitierPaiementController(details?: PaieParLivreur, isOpen?: boolean) {
    const [detailFichePaie, setDetailFichePaie] = useState<FichePaieDetailVM | null>();
    const [gainsHedomadaires, setGainsHedomadaires] = useState<GainHebdomadaireVm | undefined>()
    const initierPaiementClosure = useDisclosure();

    const fetchDetailFichePaie = async () => {
        try {
            if (details && details.id) {
                const result = await getFichePaieById(details.id);
                setDetailFichePaie(result)
            } else {
                const result = await getFichePaieByEmploiAndLivreur(details?.emploiId ?? "", details?.livreurId ?? "");
                setDetailFichePaie(result)
            }
        } catch (error) {
        }
    }

    useEffect(() => {
        fetchDetailFichePaie()
    }, [details, isOpen]);

    const creneauDePaieClosure = useDisclosure();

    const onpenCrennauxDialog = (gainsHedomadaires?: GainHebdomadaireVm) => {
        setGainsHedomadaires(gainsHedomadaires);
        creneauDePaieClosure.onOpen()
    }

    return {
        initierPaiementClosure,
        creneauDePaieClosure,
        detailFichePaie,
        onpenCrennauxDialog,
        gainsHedomadaires
    }
}