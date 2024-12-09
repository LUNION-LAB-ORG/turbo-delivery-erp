import { z } from 'zod';

// Add Collection
export const createTypePlatSchema = z.object({
    libelle: z.string(),
    description: z.string(),
    picture: z
        .instanceof(File)
        .refine((file) => file.size > 0, "L'image est requis")
        .refine((file) => file.size <= 2 * 1024 * 1024, "La taille d'image ne doit pas dépasser 2 Mo")
        .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), "Format d'image non supporté (JPEG, PNG uniquement)"),
});
export type _createTypePlatSchema = z.infer<typeof createTypePlatSchema>;
