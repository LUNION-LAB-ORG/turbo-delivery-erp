'use server';

import { redirect } from 'next/navigation';
import { signOut as signOutAuth } from '@/auth';

import { processFormData } from '@/utils/formdata-zod.utilities';
import { apiClient } from '@/lib/api-client';
import { ActionResult, PaginatedResponse } from '@/types/index.d';
import usersEndpoints from '@/src/endpoints/users.endpoint';
import { _createUserSchema, changePasswordSchema, createUserSchema, loginSchema } from '../schemas/users.schema';
import { signIn } from '@/auth';
import { revalidatePath } from 'next/cache';
import { User } from '@/types/models';

export async function loginUser(prevState: any, formData: FormData): Promise<ActionResult<any>> {
    const { success, data: formdata } = processFormData(
        loginSchema,
        formData,
        {
            useDynamicValidation: true,
        },
        prevState,
    );

    if (!success) {
        prevState.message = 'Email mal formaté';
        return prevState;
    }
    const response = await apiClient.post(usersEndpoints.login, {
        username: formdata.username,
        password: formdata.password,
    });
    if (response.ok) {
        await signIn('credentials-user', {
            username: formdata.username,
            password: formdata.password,
            redirect: false,
        });
        prevState.status = 'success';
        prevState.message = 'Connexion réussie';
        return prevState;
    } else {
        prevState.status = 'error';
        let result: any = '';
        try {
            result = await response.json();
            prevState.message = result.message || 'Erreur lors de la connexion';
        } catch (error) {
            try {
                result = await response.text();
                prevState.message = result || 'Erreur lors de la connexion';
            } catch (error) {
                prevState.message = 'Erreur lors de la connexion';
            }
        }

        if (response.status === 401) {
            if (result.code == 'LOG10') {
                prevState.data = {
                    changePassword: false,
                    username: formdata.username,
                };
                prevState.message = result.message || 'Veuillez modifier votre mot de passe';
            }
        }

        return prevState;
    }
}

export async function changePassword(prevState: any, formData: FormData): Promise<ActionResult<any>> {
    const { success, data: formdata } = processFormData(
        changePasswordSchema,
        formData,
        {
            useDynamicValidation: true,
        },
        prevState,
    );

    if (!success) {
        prevState.status = 'error';
        prevState.message = 'Mot de passe mal formaté';
        return prevState;
    }

    if (formdata.newPassword !== formdata.confirm_password) {
        prevState.status = 'error';
        prevState.message = 'Mot de passe et la confirmation ne sont pas identique';
        return prevState;
    }

    const response = await apiClient.post(usersEndpoints.changePassword, {
        newPassword: formdata.newPassword,
        oldPassword: formdata.oldPassword,
        username: formdata.username,
    });
    const result = await response.json();
    if (!response.ok) {
        prevState.status = 'error';
        prevState.message = result.message || 'Erreur lors du changement de mot de passe';
        return prevState;
    }
    console.log(result);
    prevState.data = result;
    prevState.status = 'success';
    prevState.message = 'Changement de mot de passe réussi';

    redirect('/');
}

export async function signOut(): Promise<void> {
    await signOutAuth();
    revalidatePath('/', 'layout');
    redirect('/auth');
}

export async function getProfile(): Promise<User | null> {
    const response = await apiClient.get(usersEndpoints.profile);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}
export async function getUsers(): Promise<PaginatedResponse<User> | null> {
    const response = await apiClient.get(usersEndpoints.getAll);
    if (!response.ok) {
        return null;
    }
    const result = await response.json();
    return result;
}

export async function createUser(prevState: any, formData: FormData): Promise<ActionResult<{ password: string; user: User }>> {
    const { success, data: formdata } = processFormData(
        createUserSchema,
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

    const response = await apiClient.post(usersEndpoints.create, formdata);
    if (!response.ok) {
        prevState.status = 'error';
        prevState.message = "Erreur lors de la création de l'utilisateur";
        return prevState;
    }
    const result = await response.json();
    prevState.data = result;
    prevState.status = 'success';
    prevState.message = 'Utilisateur créé avec succès';
    return prevState;
}

export async function deleteRestaureUser(id: string, deleted: boolean): Promise<ActionResult<any>> {
    const response = await apiClient.get(usersEndpoints.deleteRestaure(id));
    let message = '';
    try {
        const result = await response.json();
        message = result.message;
    } catch (error) {
        const result = await response.text();
        message = result;
    }
    if (!response.ok) {
        return {
            status: 'error',
            message: message ?? (!deleted ? "Erreur lors de la suppression de l'utilisateur" : "Erreur lors de la restauration de l'utilisateur"),
        };
    }
    return {
        status: 'success',
        message: !deleted ? 'Utilisateur supprimé avec succès' : 'Utilisateur restauré avec succès',
    };
}

export async function disableEnableUser(id: string, status: number): Promise<ActionResult<User>> {
    const response = await apiClient.get(usersEndpoints.disableEnable(id));
    let message = '';
    try {
        const result = await response.json();
        message = result.message;
    } catch (error) {
        const result = await response.text();
        message = result;
    }
    if (!response.ok) {
        return {
            status: 'error',
            message: message ?? (status === 1 ? "Erreur lors de la désactivation de l'utilisateur" : "Erreur lors de l'activation de l'utilisateur"),
        };
    }
    return {
        status: 'success',
        message: status === 1 ? 'Utilisateur désactivé avec succès' : 'Utilisateur activé avec succès',
    };
}
