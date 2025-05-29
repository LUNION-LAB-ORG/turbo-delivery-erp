'use server';

import { ActionResult, PaginatedResponse } from '@/types';

import { ChangerRestaurantLivreurCommande, ChangerStatutLivreurCommande, DeliveryMan, DemandeAssignationVM, LivreurDisponible, LivreurStatutVM, Restaurant, ValiderDemandeAssignationCommande } from '@/types/models';
import { apiClientHttp } from '@/lib/api-client-http';

// Configuration
const BASE_URL = '/api/erp';

const deliveryMenEndpoints = {
    getLivreursDisponible: { endpoint: `${BASE_URL}/livreur/disponible`, method: 'GET' },
    getAll: { endpoint: `${BASE_URL}/livreur/valid/opsmanager`, method: 'GET' },
    getAllValidated: { endpoint: `${BASE_URL}/livreur/valid/authserv`, method: 'GET' },
    getAllNoValidated: { endpoint: `${BASE_URL}/livreur/invalid`, method: 'GET' },
    validateAuth: { endpoint: (id: string) => `${BASE_URL}/livreur/enable/authserv/${id}`, method: 'GET' },
    validateOps: { endpoint: (id: string) => `${BASE_URL}/livreur/enable/opsmanager/${id}`, method: 'GET' },
    info: { endpoint: (id: string) => `${BASE_URL}/livreur/get/info/${id}`, method: 'GET' },

    //endpoint pour lister tout les liveures
    getAllDeliveryMan: { endpoint: `${BASE_URL}/livreur/infos`, method: 'GET' },
    getDeliveryDetail: { endpoint: (id: string) => `${BASE_URL}/livreur/info/${id}`, method: 'GET' },
    mettreLivreurEnAttente: { endpoint: (id: string) => `${BASE_URL}/statut/${id}/mettre-attente`, method: 'GET' },
    changerRestaurantLivreur: { endpoint: `${BASE_URL}/livreur/statut/changer-restaurant `, method: 'PUT' },


    //Demande d'assignation
    getAllemandeAssignation: { endpoint: `${BASE_URL}/demande-assignation`, method: "GET" },
    validerDemandeAssignations: { endpoint: `${BASE_URL}/demande-assignation`, method: 'POST' },
    rejeterDemandeAssignations: { endpoint: (id: string) => `${BASE_URL}/demande-assignation/${id}/rejeter`, method: "PUT" },

    //Statut livreur
    getToutLivreurStatus: { endpoint: `${BASE_URL}/livreur/statut/tous`, method: "GET" },
    getToutLivreurStatusAssigners: { endpoint: `${BASE_URL}/livreur/statut/tous-assigne`, method: "GET" },
    getToutLivreurStatusNonAssigners: { endpoint: `${BASE_URL}/livreur/statut/tous-non-assigne`, method: "GET" },
    changerStatusLivreur: { endpoint: `${BASE_URL}/livreur/statut/changer`, method: "PUT" },
};

export async function getLivreursDisponible(): Promise<LivreurDisponible[]> {
    try {
        const data = await apiClientHttp.request<LivreurDisponible[]>({
            endpoint: deliveryMenEndpoints.getLivreursDisponible.endpoint,
            method: deliveryMenEndpoints.getLivreursDisponible.method,
            service: 'backend',
        });
        return data;
    } catch (error) {
        return [];
    }
}

export async function getDeliveryMen(page: number = 0, size: number = 10): Promise<PaginatedResponse<DeliveryMan> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<DeliveryMan>>({
            endpoint: deliveryMenEndpoints.getAll.endpoint,
            method: deliveryMenEndpoints.getAll.method,
            service: 'backend',
            params: {
                page: page.toString(),
                size: size.toString(),
            },
        });
        return data;
    } catch (error) {
        return null;
    }
}

export async function getDeliveryMenValidated(page: number = 0, size: number = 10): Promise<PaginatedResponse<DeliveryMan> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<DeliveryMan>>({
            endpoint: deliveryMenEndpoints.getAllValidated.endpoint,
            method: deliveryMenEndpoints.getAllValidated.method,
            service: 'backend',
            params: {
                page: String(page),
                size: String(size),
            },
        });
        return data;
    } catch (error) {
        return null;
    }
}

export async function getDeliveryMenNoValidated(page: number = 0, size: number = 10): Promise<PaginatedResponse<DeliveryMan> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<DeliveryMan>>({
            endpoint: deliveryMenEndpoints.getAllNoValidated.endpoint,
            method: deliveryMenEndpoints.getAllNoValidated.method,
            service: 'backend',
            params: {
                page: page.toString(),
                size: size.toString()
            }
        });
        return data;
    } catch (error) {
        return null;
    }
}

export async function validateDeliveryMan(id: string, validateBy: 'auth' | 'ops' | 'no-body'): Promise<ActionResult<DeliveryMan>> {
    if (validateBy == 'auth') {
        try {
            const data = await apiClientHttp.request<DeliveryMan>({
                endpoint: deliveryMenEndpoints.validateAuth.endpoint(id),
                method: deliveryMenEndpoints.validateAuth.method,
                service: 'backend',
            });
            return {
                status: 'success',
                message: 'Livreur activé avec succès',
                data: data,
            };
        } catch (error: any) {
            return {
                status: 'error',
                message: error.message || "Erreur lors de l'activation du livreur",
            };
        }
    }
    if (validateBy == 'ops') {
        try {
            const data = await apiClientHttp.request<DeliveryMan>({
                endpoint: deliveryMenEndpoints.validateOps.endpoint(id),
                method: deliveryMenEndpoints.validateOps.method,
                service: 'backend',
            });
            return {
                status: 'success',
                message: 'Livreur activé avec succès',
                data: data,
            };
        } catch (error: any) {
            return {
                status: 'error',
                message: "Erreur lors de l'activation du livreur",
            };
        }
    }
    return {
        status: 'error',
        message: 'Méthode de validation invalide',
    };
}

//Demande d'assignation
export async function getAllDemandeAssignations(): Promise<DemandeAssignationVM[]> {
    try {
        const data = await apiClientHttp.request<DemandeAssignationVM[]>({
            endpoint: deliveryMenEndpoints.getAllemandeAssignation.endpoint,
            method: deliveryMenEndpoints.getAllemandeAssignation.method,
            service: 'backend',
        });
        return data;
    } catch (error) {
        return [] as DemandeAssignationVM[]
    }
}

export async function validerDemandeAssignations(commande: ValiderDemandeAssignationCommande): Promise<any> {
    try {
        const data = await apiClientHttp.request<void>({
            endpoint: deliveryMenEndpoints.validerDemandeAssignations.endpoint,
            method: deliveryMenEndpoints.validerDemandeAssignations.method,
            service: 'backend',
            data: commande
        });
        return {
            status: 'success',
            message: 'Demande d\'assignation validée avec succès',
            data: data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error.message || 'Erreur lors de la création de la demande d\'assignation'
        }
    }
}

export async function rejeterDemandeAssignations(id: string): Promise<any> {
    try {
        const data = await apiClientHttp.request<void>({
            endpoint: deliveryMenEndpoints.rejeterDemandeAssignations.endpoint(id),
            method: deliveryMenEndpoints.rejeterDemandeAssignations.method,
            service: 'backend',
        });
        return {
            status: 'success',
            message: "La demande d'identification a été rejetée ",
            data: data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: "Erreur lors du rejet de la demande d'assignation",
        };
    }
}


//Statut livreurs
export async function getToutLivreurStatus(page: number = 0, size: number = 10): Promise<PaginatedResponse<LivreurDisponible[]> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<LivreurDisponible[]> | null>({
            endpoint: deliveryMenEndpoints.getToutLivreurStatus.endpoint,
            method: deliveryMenEndpoints.getToutLivreurStatus.method,
            service: 'backend',
            params: {
                page: page.toString(),
                size: size.toString()
            }
        });
        return data;
    } catch (error) {
        return null;
    }
}

export async function getToutLivreurStatusAssigners(page: number = 0, size: number = 10): Promise<PaginatedResponse<LivreurDisponible[]> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<LivreurDisponible[]> | null>({
            endpoint: deliveryMenEndpoints.getToutLivreurStatusAssigners.endpoint,
            method: deliveryMenEndpoints.getToutLivreurStatusAssigners.method,
            service: 'backend',
            params: {
                page: page.toString(),
                size: size.toString()
            }
        });
        return data;
    } catch (error) {
        return null;
    }
}

export async function changerStatusLivreur(commande: ChangerStatutLivreurCommande): Promise<any> {
    try {
        const data = await apiClientHttp.request<any>({
            endpoint: deliveryMenEndpoints.changerStatusLivreur.endpoint,
            method: deliveryMenEndpoints.changerStatusLivreur.method,
            service: 'backend',
            data: commande
        });
        return {
            status: 'success',
            message: 'Statut du livreur modifié avec succès',
            data: data,
        };
    } catch (error: any) {
        if (error.response && error.response?.data.message) {
            return {
                status: 'error',
                message: error.response?.data.message
            }
        } else {
            return {
                status: 'error',
                message: error.message || 'Erreur lors du changement de statut du livreur'
            }
        }

    }
}

export async function changerRestaurantLivreur(commande: ChangerRestaurantLivreurCommande): Promise<any> {
    try {
        const data = await apiClientHttp.request<any>({
            endpoint: deliveryMenEndpoints.changerRestaurantLivreur.endpoint,
            method: deliveryMenEndpoints.changerRestaurantLivreur.method,
            service: 'backend',
            data: commande
        });
        return {
            status: 'success',
            message: 'Le restaurant du livreur a été changeé  avec succès',
            data: data,
        };
    } catch (error: any) {
        if (error.response && error.response?.data.message) {
            return {
                status: 'error',
                message: error.response?.data.message || "Une erreur s'est produite lors du changer du restaurant du livreur"
            }
        } else {
            return {
                status: 'error',
                message: error.message || 'Erreur lors du changement du restaurant du livreur'
            }
        }

    }
}

export async function getToutLivreurStatusNonAssigners(page: number, size: number): Promise<PaginatedResponse<LivreurDisponible[]> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<LivreurDisponible[]> | null>({
            endpoint: deliveryMenEndpoints.getToutLivreurStatusNonAssigners.endpoint,
            method: deliveryMenEndpoints.getToutLivreurStatusNonAssigners.method,
            service: 'backend',
            params: {
                page: page.toString(),
                size: size.toString()
            }
        });
        return data;
    } catch (error) {
        return null;
    }
}

export async function getDeliveryDetail(id: string): Promise<DeliveryMan | null> {
    try {
        const data = await apiClientHttp.request<DeliveryMan | null>({
            endpoint: deliveryMenEndpoints.getDeliveryDetail.endpoint(id),
            method: deliveryMenEndpoints.getDeliveryDetail.method,
            service: 'backend',
        });
        return data;
    } catch (error) {
        return null;
    }
}

export async function getAllDeliveryMan(): Promise<DeliveryMan[]> {
    try {
        const data = await apiClientHttp.request<DeliveryMan[]>({
            endpoint: deliveryMenEndpoints.getAllDeliveryMan.endpoint,
            method: deliveryMenEndpoints.getDeliveryDetail.method,
            service: 'backend',
        });
        return data;
    } catch (error) {
        return [] as DeliveryMan[];
    }
}

export async function mettreLivreurEnAttente(livreurId: string): Promise<any> {
    console.log("livreurId: " + livreurId)
    try {
        const data = await apiClientHttp.request<any>({
            endpoint: deliveryMenEndpoints.mettreLivreurEnAttente.endpoint(livreurId),
            method: deliveryMenEndpoints.mettreLivreurEnAttente.method,
            service: 'backend',
        });
        return {
            status: 'success',
            message: 'Livreur mis en attente avec succès',
            data: data,
        };
    } catch (error: any) {
        console.log("erreur+++++++++", error);
        return {
            status: 'error',
            message: error.message || 'Erreur lors de la mise en attente du livreur'
        }
    }
}
