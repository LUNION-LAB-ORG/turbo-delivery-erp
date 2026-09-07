import { useOuverture } from '@/hooks/use-ouverture';
import { getFichePaieByEmploiAndLivreur, getFichePaieById } from "@/src/actions/gestion-de-paie.actions";
import { FichePaieDetailVM, GainHebdomadaireVm, GainParJour, GainVm, PaieParLivreur } from "@/types/gestion-de-paie.model";
import { useEffect, useState } from "react";

export function useInitierPaiementController(details?: PaieParLivreur, isOpen?: boolean) {
    const [detailFichePaie, setDetailFichePaie] = useState<FichePaieDetailVM | null>();
    const [gainsHedomadaires, setGainsHedomadaires] = useState<GainHebdomadaireVm | undefined>()
    // Les deux lectures relancent desormais au lieu de rendre null : sans cet etat,
    // l'echec retombait sur le meme rendu que "aucun detail" et la fiche paraissait
    // vide, alors que le gain a payer existe et n'a pas pu etre lu.
    const [erreur, setErreur] = useState(false);
    const [chargement, setChargement] = useState(false);

    const fetchDetailFichePaie = async () => {
        // remis a faux a chaque tentative pour ne pas afficher une panne resolue
        setErreur(false);
        setChargement(true);
        try {
            if (details && details.id) {
                const result = await getFichePaieById(details.id);
                setDetailFichePaie(result)
            } else {
                const result = await getFichePaieByEmploiAndLivreur(details?.emploiId ?? "", details?.livreurId ?? "");
                setDetailFichePaie(result)
            }
        } catch (error) {
            console.error(error);
            setErreur(true);
        } finally {
            setChargement(false);
        }
    }

    useEffect(() => {
        fetchDetailFichePaie()
    }, [details, isOpen]);

    const creneauDePaieClosure = useOuverture();

    const onpenCrennauxDialog = (gainsHedomadaires?: GainHebdomadaireVm) => {
        setGainsHedomadaires(gainsHedomadaires);
        creneauDePaieClosure.onOpen()
    }

    return {
        creneauDePaieClosure,
        detailFichePaie,
        onpenCrennauxDialog,
        gainsHedomadaires,
        erreur,
        chargement,
        reessayer: fetchDetailFichePaie
    }
}