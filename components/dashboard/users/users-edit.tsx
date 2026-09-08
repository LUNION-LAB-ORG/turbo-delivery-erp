'use client';

import { toast } from 'sonner';
import { Role, User } from '@/types/models';
import EtatErreur from '@/components/commons/EtatErreur';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useActionState } from 'react';
import { updateUser } from '@/src/actions/users.actions';
import { getAllRoles } from '@/src/actions/roles.actions';
import React, { useCallback, useEffect, useState } from 'react';
import { _createUserSchema, createUserSchema } from '@/src/schemas/users.schema';
import { ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';

const UsersEdit = ({ user, open, setOpen }: { user: User; open: boolean; setOpen: (open: boolean) => void }) => {
    /*
     * `useFormStatus()` etait appele ICI, dans le composant qui rend le `<form>`.
     * Le hook ne lit l'etat que depuis un composant ENFANT du formulaire : appele au
     * meme niveau, il renvoie toujours `pending: false`. Le bouton n'indiquait donc
     * jamais l'envoi en cours et restait cliquable.
     *
     * `SubmitButton` (components/ui/form-ui/submit-button.tsx) fait exactement cela
     * correctement : il appelle le hook depuis l'interieur du formulaire, et il existait
     * deja dans le depot.
     */

    const [state, formAction] = useActionState(
        async (_: any, formData: FormData) => {
            const result = await updateUser(user.id, formData);

            if (result.status === 'success') {
                toast.success(result.message || 'Utilisateur modifié avec succès');
                window.location.reload();
            } else {
                toast.error(result.message || "Erreur lors de l'envoi de l'email");
            }

            return result;
        },
        {
            data: null,
            message: '',
            errors: {},
            status: 'idle',
            code: undefined,
        },
    );

    const [roles, setRoles] = useState<Role[]>([]);
    // getAllRoles relance desormais. Sans rattrapage ici, l echec restait invisible : le
    // selecteur affichait une liste VIDE, et le role deja porte par l utilisateur
    // disparaissait de l ecran, comme s il n en avait pas.
    const [erreurRoles, setErreurRoles] = useState<boolean>(false);
    const [chargementRoles, setChargementRoles] = useState<boolean>(false);

    const rolesSelections = roles.map((r) => ({
        label: r.libelle,
        value: r.id,
    }));

    const fetchRole = useCallback(async () => {
        // Remis a faux a chaque tentative, sinon un succes apres reessai garderait l erreur
        setErreurRoles(false);
        setChargementRoles(true);
        try {
            const result = await getAllRoles();
            if (result) {
                setRoles(result);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des roles:', error);
            setErreurRoles(true);
        } finally {
            setChargementRoles(false);
        }
    }, []);

    useEffect(() => {
        fetchRole();
    }, [fetchRole]);

    const {
        formState: { errors },
        control,
        watch,
    } = useForm<_createUserSchema>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: user.username,
            name: user.nom,
            prenoms: user.prenoms,
            email: user.email,
            role: String(user.role.id),
        },
    });

    const watchedRole = watch("role");

    const nom = [user.prenoms, user.nom].filter(Boolean).join(' ') || user.username;

    return (
        <FenetreAction onFermer={() => setOpen(false)} ouvert={open} titre={`Modifier ${nom}`}>
            {/*
             * Le titre de cette fenetre disait « Ajouter un utilisateur » et son bouton
             * « Ajouter » : un copier-coller depuis la fenetre de creation, reste tel quel.
             * Elle MODIFIE un compte existant.
             */}
            {erreurRoles ? (
                <EtatErreur enCours={chargementRoles} onReessayer={() => fetchRole()} quoi="les rôles" />
            ) : (
                <form action={formAction} className="flex flex-col gap-4">
                    <input name="role" type="hidden" value={watchedRole ?? ''} />
                    {/* Chaque champ portait un `aria-label` en ANGLAIS, « username input »
                        ou « prenoms input », qui REMPLACE le libelle francais pour le
                        lecteur d'ecran. */}
                    <Controller
                        control={control}
                        name="username"
                        render={({ field }) => (
                            <>
                                <input name="username" type="hidden" value={field.value ?? ''} />
                                <ChampTexte
                                    erreur={errors.username?.message}
                                    label="Nom d'utilisateur"
                                    onChange={field.onChange}
                                    placeholder="Entrez le nom d'utilisateur"
                                    valeur={field.value ?? ''}
                                />
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="name"
                        render={({ field }) => (
                            <>
                                <input name="name" type="hidden" value={field.value ?? ''} />
                                <ChampTexte
                                    erreur={errors.name?.message}
                                    label="Nom"
                                    onChange={field.onChange}
                                    placeholder="Entrez le nom"
                                    valeur={field.value ?? ''}
                                />
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="prenoms"
                        render={({ field }) => (
                            <>
                                <input name="prenoms" type="hidden" value={field.value ?? ''} />
                                <ChampTexte
                                    erreur={errors.prenoms?.message}
                                    label="Prénoms"
                                    onChange={field.onChange}
                                    placeholder="Entrez les prénoms"
                                    valeur={field.value ?? ''}
                                />
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="email"
                        render={({ field }) => (
                            <>
                                <input name="email" type="hidden" value={field.value ?? ''} />
                                <ChampTexte
                                    erreur={errors.email?.message}
                                    label="Email"
                                    onChange={field.onChange}
                                    placeholder="Entrez l'email"
                                    type="email"
                                    valeur={field.value ?? ''}
                                />
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="role"
                        render={({ field }) => (
                            <ChampListe
                                erreur={errors.role?.message}
                                label="Rôle"
                                onChange={field.onChange}
                                options={rolesSelections.map((r) => ({
                                    label: r.label,
                                    value: String(r.value),
                                }))}
                                placeholder="Rechercher un rôle"
                                valeur={field.value ? String(field.value) : ''}
                            />
                        )}
                    />

                    <div className="flex items-center justify-end">
                        <SubmitButton className="w-auto">Enregistrer</SubmitButton>
                    </div>
                </form>
            )}
        </FenetreAction>
    );
};

export default UsersEdit;
