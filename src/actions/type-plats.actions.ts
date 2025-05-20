'use server';

import { ActionResult } from '@/types/index.d';

import { Collection } from '@/types/models';
import { createFormData, processFormData } from '@/utils/formdata-zod.utilities';
import { createTypePlatSchema } from '../schemas/type-plats.schema';
import { apiClientHttp } from '@/lib/api-client-http';

const BASE_URL = '/api/turbo/erp/collection';

const typePlatsEndpoints = {
    getAll: { endpoint: BASE_URL, method: 'GET' },
    add: { endpoint: `${BASE_URL}/add`, method: 'POST' },
    update: { endpoint: (id: string) => `${BASE_URL}/update/${id}`, method: 'POST' },
    delete: { endpoint: (id: string) => `${BASE_URL}/delete/${id}`, method: 'DELETE' },
    info: { endpoint: (id: string) => `${BASE_URL}/detail/${id}`, method: 'GET' },
};

export async function getTypePlats(): Promise<Collection[]> {
    try {
        const data = await apiClientHttp.request<Collection[]>({
            endpoint: typePlatsEndpoints.getAll.endpoint,
            method: typePlatsEndpoints.getAll.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        return [];
    }
}

export async function createTypePlat(formData: FormData): Promise<ActionResult<Collection>> {
    try {
        const { success, data: formdata,errorsInArray } = processFormData(createTypePlatSchema, formData, {
            useDynamicValidation: true,
        });

        if (!success && errorsInArray) {
            return {
                status: 'error',
                message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
            };
        }

        const sendFormData = createFormData(formdata);

        const data = await apiClientHttp.request<Collection>({
            endpoint: typePlatsEndpoints.add.endpoint,
            method: typePlatsEndpoints.add.method,
            data: sendFormData,
            config: {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
            service: 'erp',
        });

        return {
            status: 'success',
            message: 'Type de plat créé avec succès',
            data,
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Erreur lors de la création du type de plat',
        };
    }
}

export async function updateTypePlat(formData: FormData, id: string): Promise<ActionResult<Collection>> {
    try {
        const { success, data: formdata,errorsInArray } = processFormData(createTypePlatSchema, formData, {
            useDynamicValidation: true,
        });

        if (!success && errorsInArray) {
            return {
                status: 'error',
                message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
            };
        }
        const sendFormData = createFormData(formdata);

        const data = await apiClientHttp.request<Collection>({
            endpoint: typePlatsEndpoints.update.endpoint(id),
            method: typePlatsEndpoints.update.method,
            data: sendFormData,
            config: {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
            service: 'erp',
        });

        return {
            status: 'success',
            message: 'Type de plat modifié avec succès',
            data,
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Erreur lors de la modification du type de plat',
        };
    }
}

export async function getTypePlat(id: string): Promise<Collection | null> {
    try {
        const data = await apiClientHttp.request<Collection>({
            endpoint: typePlatsEndpoints.info.endpoint(id),
            method: typePlatsEndpoints.info.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        return null;
    }
}
