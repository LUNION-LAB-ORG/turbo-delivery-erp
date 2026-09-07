import { useOuverture } from '@/hooks/use-ouverture';
import { Chip } from '@heroui-v3/react';
import { useEffect, useState } from "react";
import { CircleCheckBig, Minus } from "lucide-react";
import { InfoParJour, PaieErpVM, PaieParLivreur } from "@/types/gestion-de-paie.model";
import { JourTravaille } from "@/types/creneau-bird";

export function useTableauDePaiController(initialData: PaieErpVM | null, searchKey?: string) {
    const [data, setData] = useState<PaieParLivreur[]>(initialData?.paies || [])
    const { isOpen, onOpen, onClose } = useOuverture();
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

    /**
     * Le type de rattachement d'un livreur.
     *
     * <p>« Bird » etait peint en `bg-primary/10 text-primary`, c'est-a-dire dans le ROUGE
     * DE MARQUE, et « Assigne » en `bg-yellow-100 text-yellow-500` — du jaune sur du jaune,
     * dont le contraste tourne autour de 1,5:1 : le mot etait pratiquement invisible. Ce
     * sont trois CATEGORIES de rattachement, pas trois etats : elles se lisent.</p>
     */
    const getStatusChip = (status?: string) => {
        const libelle =
            status === 'FREE' ? 'Bird' : status === 'TURBO' ? 'Assigné' : status === 'WAITING' ? 'En attente' : null;
        if (!libelle) return null;
        return (
            <Chip size="sm" variant="soft">
                <Chip.Label>{libelle}</Chip.Label>
            </Chip>
        );
    };

    /**
     * La ligne est-elle complete ?
     *
     * <p>Le cas par defaut de cette fonction renvoyait la chaine `"test"` — rendue telle
     * quelle dans la cellule. Et l'asterisque qui signale une semaine incomplete etait un
     * `<span className="text-primary z-40 -ml-2 -mt-2 text-3xl">*</span>` : un asterisque
     * rouge de trente pixels, tire hors de son flux pour chevaucher l'icone d'a cote, et
     * annonce a aucun lecteur d'ecran.</p>
     */
    const conditionValidation = (items: PaieParLivreur) => {
        const joursIncomplets = !items?.joursTravaille
            ?.map((item: InfoParJour) => item.statut)
            .includes('VALIDE');
        const weekEndValide = items?.weekEnd?.map((item: InfoParJour) => item.statut).includes('VALIDE');

        if (!weekEndValide) {
            return (
                <span className="inline-flex items-center text-muted" title="Week-end non validé">
                    <Minus aria-hidden="true" size={20} />
                    <span className="sr-only">Week-end non validé</span>
                </span>
            );
        }

        return (
            <span
                className="inline-flex items-center gap-1 text-success"
                title={joursIncomplets ? 'Week-end validé, semaine incomplète' : 'Semaine validée'}
            >
                <CircleCheckBig aria-hidden="true" size={20} />
                {joursIncomplets && <span aria-hidden="true" className="text-warning">*</span>}
                <span className="sr-only">
                    {joursIncomplets ? 'Week-end validé, semaine incomplète' : 'Semaine validée'}
                </span>
            </span>
        );
    };

    const openDetailModal = (item: PaieParLivreur) => {
        const isNotValid = !item?.joursTravaille?.map(((item: any) => item.isWorking)).includes("VALIDE");
        setNonEligible(isNotValid)
        setDetails(item);
        onOpen();
    }

    /**
     * Une journee de la semaine, validee ou non.
     *
     * <p>Les quatre pastilles etaient peintes a la main, et trois d'entre elles portaient
     * `text-white` : `bg-yellow-400 text-white` pour un jour valide (blanc sur jaune, sous
     * 2:1), `bg-primary/70 text-white` pour un jour non valide — le rouge de marque —,
     * `bg-green-500 text-white` et `bg-surface-tertiary text-white` pour le week-end, cette
     * derniere etant du BLANC SUR UNE SURFACE CLAIRE, donc rien du tout.</p>
     *
     * <p>Elles ne portaient par ailleurs que l'INITIALE du jour, sans dire de quel jour ni
     * de quel etat il s'agissait : « L M M J V », en couleurs, et rien pour un lecteur
     * d'ecran.</p>
     */
    const pastilleJour = (jour: InfoParJour | undefined, minuscule = false) => {
        if (!jour) return null;
        const valide = jour.statut === 'VALIDE';
        const initiale = jour.jour?.charAt(0);
        return (
            <Chip
                className="mr-1"
                color={valide ? 'success' : 'default'}
                size="sm"
                variant="soft"
            >
                <Chip.Label>
                    <span aria-hidden="true">
                        {minuscule ? initiale?.toLowerCase() : initiale?.toUpperCase()}
                    </span>
                    <span className="sr-only">{`${jour.jour} : ${valide ? 'validé' : 'non validé'}`}</span>
                </Chip.Label>
            </Chip>
        );
    };

    const recupererStatutJours = (jours?: InfoParJour) => pastilleJour(jours);
    const recupererStatutJoursWeekend = (weekend?: InfoParJour) => pastilleJour(weekend, true);

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