import { reportingBonLivraisonTerminers } from "@/src/actions/bon-commande.action";
import { reportingSchema, TypeReportingSchema } from "@/src/schemas/reporting.schema"
import { FormatsSupportes, TypeCommission } from "@/types/bon-livraison.model";
import { saveAsExcelFile, saveAsPDFFile } from "@/utils/reporting-file";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Restaurant } from '@/types/models';
import { toast } from "react-toastify";


export function useReportingController(restaurant?: Restaurant) {
    const initialiValues: TypeReportingSchema = {
        restaurantId: "",
        debut: "",
        fin: "",
        type: "",
        format: ""
    };
    const form = useForm<TypeReportingSchema>({
        resolver: zodResolver(reportingSchema),
        defaultValues: Object.assign({}, initialiValues),
    });

    const onPreview = async () => {
        await form.trigger();
        const data: TypeReportingSchema = form.getValues();
        try {
            const result = await reportingBonLivraisonTerminers({
                restaurantId: restaurant ? restaurant?.id : "",
                debut: data.debut ?? "",
                fin: data.fin ?? "",
                type: undefined,
                format: data.format as FormatsSupportes
            });
            if (result) {
                const uint8Array = new Uint8Array(result);
                const file = new Blob([uint8Array], { type: "application/pdf" });
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL, "_blank");
            }
        } catch (error: any) {
            if (error.response && error.response?.data) {
                toast.error(error.response?.data?.detail)
            } else if (error.response && error.response?.message) {
                toast.error(error.response?.message)
            } else {
                toast.error("Une erreur s'est produite")
            }
        }
    };


    const onexportFile = async () => {
        await form.trigger();
        const data: TypeReportingSchema = form.getValues();
        try {
            const result = await reportingBonLivraisonTerminers({
                restaurantId: data.restaurantId,
                debut: data.debut ?? "",
                fin: data.fin ?? "",
                type: undefined,
                format: data.format as FormatsSupportes
            });

            if (data?.format === "PDF" && result != null) {
                const uint8Array = new Uint8Array(result);
                try {

                    saveAsPDFFile(uint8Array, "bon-de-livraison-termine");
                } catch (e) {
                    console.log("Erreur lors de l'exportation du fichier pdf");
                }
            }
            if (data?.format === "EXCEL" && result != null) {
                const uint8Array = new Uint8Array(result);
                try {
                    saveAsExcelFile(uint8Array, "bon-de-livraison-termine");
                } catch (e) {
                    console.log("Erreur lors de l'exportation du fichier pdf");
                }
            }
        } catch (error: any) {
            if (error.response && error.response?.data) {
                toast.error(error.response?.data?.detail)
            } else if (error.response && error.response?.message) {
                toast.error(error.response?.message)
            } else {
                toast.error("Une erreur s'est produite")
            }
        }
    };



    return {
        onexportFile,
        onPreview,
        form
    }
}
