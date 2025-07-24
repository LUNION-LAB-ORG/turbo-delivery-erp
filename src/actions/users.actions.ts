'use server';

import { redirect } from 'next/navigation';
import { signOut as signOutAuth } from '@/auth';

import { processFormData } from '@/utils/formdata-zod.utilities';
import { ActionResult, PaginatedResponse } from '@/types';
import { _createUserSchema, changePasswordSchema, createUserSchema, loginSchema } from '../schemas/users.schema';
import { signIn } from '@/auth';
import { revalidatePath } from 'next/cache';
import { User } from '@/types/models';
import { apiClientHttp } from '@/lib/api-client-http';
// import api from '@/app/(protected)/config';

const BASE_URL = '/api/V1/turbo/erp/user';

const usersEndpoints = {
    base: { endpoint: `${BASE_URL}`, method: 'GET' },
    login: { endpoint: `${BASE_URL}/login`, method: 'POST' },
    changePassword: { endpoint: `${BASE_URL}/change/password`, method: 'POST' },
    profile: { endpoint: `${BASE_URL}/profile`, method: 'GET' },
    getAll: { endpoint: `${BASE_URL}/get/0`, method: 'GET' },
    getOne: { endpoint: `${BASE_URL}/info`, method: 'GET' },
    update: { endpoint: `${BASE_URL}/update`, method: 'POST' },
    disableEnable: { endpoint: (id: string) => `${BASE_URL}/disable/enable/${id}`, method: 'GET' },
    deleteRestaure: { endpoint: (id: string) => `${BASE_URL}/delete/restaured/${id}`, method: 'GET' },
    create: { endpoint: `${BASE_URL}/create`, method: 'POST' },
};

export async function loginUser(formData: FormData): Promise<ActionResult<any>> {
    const {
      success,
      data: formdata,
      errorsInArray,
    } = processFormData(loginSchema, formData, {
        useDynamicValidation: true,
    });
  
    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }
  
    try {
        // 🔐 Envoie la requête login
        const result = await fetch(`${process.env.NEXT_PUBLIC_API_ERP_URL}${usersEndpoints.login.endpoint}`, {
            method: usersEndpoints.login.method,
            body: JSON.stringify({ username: formdata.username, password: formdata.password }),
            headers: { 'Content-Type': 'application/json' },
        });
    
        const contentType = result.headers.get('content-type');
    
        let json: any = {};
        if (contentType && contentType.includes('application/json')) {
            json = await result.json();
        } else {
            const text = await result.text(); // Pour voir le contenu brut
            console.error('Réponse non JSON :', text);
        }
    
        if (!result.ok) {
            return {
                status: 'error',
                message: json?.message ?? 'Identifiants incorrects',
                data: {
                    user: {
                        changePassword: true,
                        username: '',
                    }
                },
            };
        }
  
        // Authentifie via NextAuth
        await signIn('credentials-user', {
            username: formdata.username,
            password: formdata.password,
            redirect: false,
        });
  
        return {
            status: 'success',
            message: 'Connexion réussie',
            data: json,
        };
    } catch (err: any) {
        console.error('Erreur lors de la connexion:', err);
        return {
            status: 'error',
            message: 'Erreur serveur. Veuillez réessayer.',
        };
    }
}
  

// export async function loginUserV2(formData: FormData): Promise<ActionResult<any>> {
//     try {
//         const result = await api.post(usersEndpoints.login.endpoint, formData);

//         if (result.status === 200) {
//             return {
//                 status: "success",
//                 message: "Connexion réussite",
//                 data: result
//             }
//         } else {
//             return {
//                 status: "success",
//                 message: "Une erreur ss'est produite"
//             }
//         }


//     } catch (error: any) {
//         if (error?.response?.status === 401) {
//             console.log("result", error?.response?.data)
//             if (error?.response?.data?.code == 'LOG10') {
//                 return {
//                     status: 'success',
//                     message: error?.response?.data?.message || error?.response?.data || 'Veuillez modifier votre mot de passe',
//                     data: error?.response?.data
//                 };
//             }
//         }
//         return {
//             status: 'error',
//             message: error?.response?.data?.detail || error?.response?.data || 'Erreur lors de la connexion',
//         };
//     }
// };


export async function changePassword(formData: FormData): Promise<ActionResult<any>> {
    const {
        success,
        data: formdata,
        errorsInArray,
    } = processFormData(changePasswordSchema, formData, {
        useDynamicValidation: true,
    });

    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }

    if (formdata.newPassword !== formdata.confirm_password) {
        return {
            status: 'error',
            message: 'Mot de passe et la confirmation ne sont pas identique',
        };
    }
    try {
        await apiClientHttp.request({
            endpoint: usersEndpoints.changePassword.endpoint,
            method: usersEndpoints.changePassword.method,
            data: {
                newPassword: formdata.newPassword,
                oldPassword: formdata.oldPassword,
                username: formdata.username,
            },
            service: 'erp',
        });
        return {
            status: "success",
            message: "Mot de passe modifié avec succès"
        }
        // redirect('/');
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || 'Erreur lors du changement de mot de passe',
        };
    }
}

export async function signOut(): Promise<void> {
    await signOutAuth();
    revalidatePath('/', 'layout');
    redirect('/auth');
}

export async function getProfile(): Promise<User | null> {
    try {
        const data = await apiClientHttp.request<User>({
            endpoint: usersEndpoints.profile.endpoint,
            method: usersEndpoints.profile.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        console.log("profile++++++++++++", error)
        return null;
    }
}

export async function getUsers(): Promise<PaginatedResponse<User> | null> {
    try {
        const data = await apiClientHttp.request<PaginatedResponse<User>>({
            endpoint: usersEndpoints.getAll.endpoint,
            method: usersEndpoints.getAll.method,
            service: 'erp',
        });

        return data;
    } catch (error) {
        return null;
    }
}

export async function createUser(formData: FormData): Promise<ActionResult<{ password: string; user: User }>> {
    const {
        success,
        data: formdata,
        errorsInArray,
    } = processFormData(createUserSchema, formData, {
        useDynamicValidation: true,
    });

    if (!success && errorsInArray) {
        return {
            status: 'error',
            message: errorsInArray[0].message ?? 'Données manquantes ou mal formatées',
        };
    }
    try {
        const data = await apiClientHttp.request<{ password: string; user: User }>({
            endpoint: usersEndpoints.create.endpoint,
            method: usersEndpoints.create.method,
            data: formdata,
            service: 'erp',
        });

        return {
            status: 'success',
            message: 'Utilisateur créé avec succès',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || "Erreur lors de la création de l'utilisateur",
        };
    }
}

export async function deleteRestaureUser(id: string, deleted: boolean): Promise<ActionResult<any>> {
    try {
        await apiClientHttp.request<PaginatedResponse<User>>({
            endpoint: usersEndpoints.deleteRestaure.endpoint(id),
            method: usersEndpoints.deleteRestaure.method,
            service: 'erp',
        });

        return {
            status: 'success',
            message: !deleted ? 'Utilisateur supprimé avec succès' : 'Utilisateur restauré avec succès',
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || (!deleted ? "Erreur lors de la suppression de l'utilisateur" : "Erreur lors de la restauration de l'utilisateur"),
        };
    }
}

export async function disableEnableUser(id: string, status: number): Promise<ActionResult<User>> {
    try {
        const data = await apiClientHttp.request<User>({
            endpoint: usersEndpoints.deleteRestaure.endpoint(id),
            method: usersEndpoints.deleteRestaure.method,
            service: 'erp',
        });

        return {
            status: 'success',
            message: status === 1 ? 'Utilisateur désactivé avec succès' : 'Utilisateur activé avec succès',
            data,
        };
    } catch (error: any) {
        return {
            status: 'error',
            message: error?.response?.data?.message || error?.response?.data || (status === 1 ? "Erreur lors de la désactivation de l'utilisateur" : "Erreur lors de l'activation de l'utilisateur"),
        };
    }
}
