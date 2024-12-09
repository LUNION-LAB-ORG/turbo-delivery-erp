'use server';

import { apiClient } from '@/lib/api-client';
import { ActionResult } from '@/types/index.d';

import { TypePlat } from '@/types/models';
import typePlatsEndpoints from '@/src/endpoints/type-plats.endpoint';
import { createFormData, processFormData } from '@/utils/formdata-zod.utilities';
import { createTypePlatSchema } from '../schemas/type-plats.schema';

export async function getTypePlats(): Promise<TypePlat[] | null> {
    const response = await apiClient.get(typePlatsEndpoints.getAll);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function createTypePlat(prevState: any, formData: FormData): Promise<ActionResult<TypePlat>> {
    const { success, data: formdata } = processFormData(
        createTypePlatSchema,
        formData,
        {
            useDynamicValidation: true,
        },
        prevState,
    );

    if (!success) {
        prevState.status = 'error';
        prevState.message = 'Erreur lors de la validation des données';
        return prevState;
    }
    const sendFormData = createFormData(formdata);

    const response = await apiClient.post(typePlatsEndpoints.add, sendFormData, { type: 'formData' });
    if (!response.ok) {
        prevState.status = 'error';
        prevState.message = 'Erreur lors de la création du type de plat';
        return prevState;
    }
    const result = await response.json();
    prevState.data = result;
    prevState.status = 'success';
    prevState.message = 'Type de plat créé avec succès';
    return prevState;
}

export async function updateTypePlat(prevState: any, formData: FormData, id: string): Promise<ActionResult<TypePlat>> {
    const { success, data: formdata } = processFormData(
        createTypePlatSchema,
        formData,
        {
            useDynamicValidation: true,
        },
        prevState,
    );

    if (!success) {
        prevState.status = 'error';
        prevState.message = 'Erreur lors de la validation des données';
        return prevState;
    }
    const sendFormData = createFormData(formdata);

    const response = await apiClient.post(typePlatsEndpoints.update(id), sendFormData, { type: 'formData' });
    if (!response.ok) {
        prevState.status = 'error';
        prevState.message = 'Erreur lors de la mise à jour du type de plat';
        return prevState;
    }
    const result = await response.json();
    prevState.data = result;
    prevState.status = 'success';
    prevState.message = 'Type de plat mis à jour avec succès';
    return prevState;
}

export async function getTypePlat(id: string): Promise<TypePlat | null> {
    const response = await apiClient.get(typePlatsEndpoints.info(id));
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}
