
import { z } from "zod";

export interface InputReportingField {
    restaurantId: string;
    debut: string;
    fin: string;
    type: string
    format: string;
}

export const reportingSchema = z.object({
    restaurantId: z.string().optional(),
    debut: z.string().min(1, "Ce champ est requis !"),
    fin: z.string().min(1, "Ce champ est requis !"),
    format: z.string().min(1, "Ce champ est requis !"),
    type: z.string().optional(),
});
export type TypeReportingSchema = z.infer<typeof reportingSchema>;
