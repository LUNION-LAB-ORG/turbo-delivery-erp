'use server';

import { ActionResult } from '@/types';
import { CourseExterne } from '@/types/models';
import { PaginatedResponse } from '@/types';
import { apiClientHttp } from '@/lib/api-client-http';

// Configuration
const BASE_URL = '/api/erp/course-externe';

const courseEndpoints = {
    updateCourseExterne: { endpoint: BASE_URL, method: 'PUT' },
    terminerCourseExterne: {
        endpoint: `${BASE_URL}/terminer`,
        method: 'PUT',
    },
    annulerCourseExterne: { endpoint: `${BASE_URL}/annuler`, method: 'PUT' }, //retirer
    getPaginationCourseExterneEnAttente: {
        endpoint: `${BASE_URL}/en-attente/pagination`,
        method: 'GET',
    },
    getPaginationCourseExterneAutreStatus: {
        endpoint: `${BASE_URL}/autre-statut/pagination`,
        method: 'GET',
    },
    getCourseExterne: {
        endpoint: (idCourse: string) => `${BASE_URL}/${idCourse}`,
        method: 'GET',
    },
};

export async function assignCourseExterne(courseId: string, livreurId: string, frais: number): Promise<ActionResult> {
    try {
        await apiClientHttp.request({
            endpoint: courseEndpoints.updateCourseExterne.endpoint,
            method: courseEndpoints.updateCourseExterne.method,
            data: {
                courseId,
                livreurId,
                frais,
            },
            service: 'backend',
        });

        return {
            status: 'success',
            message: 'Course assignée avec succès',
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? "Erreur lors de l'assignation de la course",
        };
    }
}

export async function getPaginationCourseExterneEnAttente(page: number = 0, size: number = 10): Promise<PaginatedResponse<CourseExterne> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<CourseExterne>>({
            endpoint: courseEndpoints.getPaginationCourseExterneEnAttente.endpoint,
            method: courseEndpoints.getPaginationCourseExterneEnAttente.method,
            params: {
                page: String(page),
                size: String(size),
            },
            service: 'backend',
        });

        return data;
    } catch (error) {
        return null;
    }
}
export async function getPaginationCourseExterneAutreStatus(page: number = 0, size: number = 10): Promise<PaginatedResponse<CourseExterne> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<CourseExterne>>({
            endpoint: courseEndpoints.getPaginationCourseExterneAutreStatus.endpoint,
            method: courseEndpoints.getPaginationCourseExterneAutreStatus.method,
            params: {
                page: String(page),
                size: String(size),
            },
            service: 'backend',
        });

        return data;
    } catch (error) {
        return null;
    }
}
export async function getCourseExterne(idCourse: string): Promise<CourseExterne | null> {
    try {
        const data = await apiClientHttp.request<CourseExterne>({
            endpoint: courseEndpoints.getCourseExterne.endpoint(idCourse),
            method: courseEndpoints.getCourseExterne.method,
            service: 'backend',
        });

        return data;
    } catch (error) {
        return null;
    }
}

export async function terminerCourseExterne(courseId: string): Promise<ActionResult<CourseExterne>> {
    try {
        const data = await apiClientHttp.request<CourseExterne>({
            endpoint: courseEndpoints.terminerCourseExterne.endpoint,
            method: courseEndpoints.terminerCourseExterne.method,
            data: {
                courseId,
            },
            service: 'backend',
        });
        return {
            status: 'success',
            message: 'Course Terminée',
            data: data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? 'Erreur lors de la terminaison de la course',
        };
    }
}

export async function cancelCourseExterne(courseId: string, restaurantId: string): Promise<ActionResult<CourseExterne>> {
    try {
        const data = await apiClientHttp.request<CourseExterne>({
            endpoint: courseEndpoints.annulerCourseExterne.endpoint,
            method: courseEndpoints.annulerCourseExterne.method,
            data: {
                restaurantId,
                courseId,
            },
            service: 'backend',
        });

        return {
            status: 'success',
            message: 'Course Annulée',
            data: data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message ?? 'Erreur lors du traitement',
        };
    }
}
