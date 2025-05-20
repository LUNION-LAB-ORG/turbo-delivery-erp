import { z } from 'zod';

// Schéma pour la creation
export const deliveryFeeCreateSchema = z.object({
    zone: z.string().min(1, 'La zone est requise'),
    latitude: z.number().min(1, 'La latitude est requise'),
    longitude: z.number().min(1, 'La longitude est requise'),
    restaurantId: z.string().min(1, 'Le restaurant est requis'),
    distanceDebut: z.number().min(0, 'La distance de début doit être supérieur ou égal à 0'),
    distanceFin: z.number().min(0, 'La distance de fin doit être supérieur ou égal à 0'),
    prix: z.number().min(0, 'Le prix doit être supérieur ou égal à 0'),
    commission: z.number().min(0, 'La commission doit être supérieur ou égal à 0'),
});

export type _deliveryFeeCreateSchema = z.infer<typeof deliveryFeeCreateSchema>;

// Schéma pour la mise à jour
export const deliveryFeeUpdateSchema = z.object({
    name:z.string(),
    zone: z.string().min(1, 'La zone est requise'),
    latitude: z.number().min(1, 'La latitude est requise'),
    longitude: z.number().min(1, 'La longitude est requise'),
    restaurantId: z.string().min(1, 'Le restaurant est requis'),
    distanceDebut: z.number().min(0, 'La distance de début doit être supérieur ou égal à 0'),
    distanceFin: z.number().min(0, 'La distance de fin doit être supérieur ou égal à 0'),
    prix: z.number().min(0, 'Le prix doit être supérieur ou égal à 0'),
    commission: z.number().min(0, 'La commission doit être supérieur ou égal à 0'),
    id: z.string().min(0, "L'identifiant doit être requis").optional(),
});

export type _deliveryFeeUpdateSchema = z.infer<typeof deliveryFeeUpdateSchema>;
