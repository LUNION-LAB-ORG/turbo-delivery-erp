'use client'
import { CardHeader } from "@/components/commons/card-header";
import { PeriodeDePaie } from "@/components/dashboard/gestion-de-paie/periode-de-paie";
import { useGestionPaieController } from "./controller";
import { TableauDePaie } from "@/components/dashboard/gestion-de-paie/tableau-de-paie/tableau-de-paie";
import { SearchField } from "@/components/commons/form/search-field";
import { PaieErpVM } from "@/types/gestion-de-paie.model";

interface ContentProps {
    initialData: PaieErpVM | null
}
export default function Content({ initialData }: ContentProps) {
    const ctrl = useGestionPaieController(initialData);
    return (
        <>
            <CardHeader title="Fiche de paie" />
            <PeriodeDePaie periodes={ctrl.periodes}
                selectedPeriodIndex={ctrl.selectedPeriodIndex}
                setSelectedPeriodIndex={ctrl.setSelectedPeriodIndex}
                MoisEnCours={ctrl.MoisEnCours}
                joursDeTravailsValides={ctrl.joursDeTravailsValides}
                handlePrevious={ctrl.handlePrevious}
                handleNext={ctrl.handleNext}
                periode={ctrl.periode}
            />
            <SearchField searchKey={ctrl.searchKey} onChange={ctrl.setSearchKey} />
            <TableauDePaie datas={ctrl.datas} periode={ctrl.periode} searchKey={ctrl.searchKey} />
        </>
    )
}

