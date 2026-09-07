'use client';

import EtatErreur from '@/components/commons/EtatErreur';
import { getAllRoles } from '@/src/actions/roles.actions';
import { createUser } from '@/src/actions/users.actions';
import { _createUserSchema, createUserSchema } from '@/src/schemas/users.schema';
import { Role } from '@/types/models';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@heroui-v3/react';
import { UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

import { ChampCopiable } from '@/components/commons/ChampCopiable';
import { ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { useActionState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';

const UsersAdd = () => {
    const [open, setOpen] = useState<boolean>(false);
    /*
     * `useFormStatus()` etait appele ICI, dans le composant qui rend le `<form>`.
     * Le hook ne lit l'etat que depuis un composant ENFANT du formulaire : appele au
     * meme niveau, il renvoie toujours `pending: false`. Le bouton n'indiquait donc
     * jamais l'envoi en cours et restait cliquable.
     *
     * `SubmitButton` (components/ui/form-ui/submit-button.tsx) fait exactement cela
     * correctement — il appelle le hook depuis l'interieur du formulaire — et existait
     * deja dans le depot.
     */
    const router = useRouter();

    const [state, formAction] = useActionState(
        async (_: any, formData: FormData) => {
            const result = await createUser(formData);

            if (result.status === 'success') {
                toast.success(result.message || 'Bravo ! vous avez réussi');
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
    // selecteur de role s affichait VIDE, ce qui se lit comme « aucun role n existe »
    // alors que le role est obligatoire et que le formulaire est donc inutilisable.
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
    } = useForm<_createUserSchema>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            username: '',
            name: '',
            prenoms: '',
            email: '',
            role: '',
        },
    });

    const fermer = () => {
        setOpen(false);
        router.refresh();
    };

    return (
        <>
            {/* C'etait un `<button className="btn btn-primary">` du gabarit d'origine. */}
            <Button onPress={() => setOpen(true)} variant="primary">
                <UserPlus aria-hidden="true" className="size-4" />
                Ajouter un utilisateur
            </Button>

            <FenetreAction
                libelleFermer={state.status === 'success' ? 'Fermer' : 'Annuler'}
                onFermer={fermer}
                ouvert={open}
                titre={
                    state.status === 'success' && state.data?.password
                        ? "Les accès de l'utilisateur créé"
                        : 'Ajouter un utilisateur'
                }
            >
                {state.status === 'success' ? (
                    /*
                     * Les identifiants etaient rendus par le `Snippet` de la v2, dans un
                     * `<li>` a puce, en VERT — comme si distribuer un mot de passe en clair
                     * etait une bonne nouvelle. `ChampCopiable` les affiche en chasse fixe
                     * avec un bouton de copie et un retour visible : sans confirmation, on
                     * recopie a la main « au cas ou ».
                     */
                    <>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted">Nom d&apos;utilisateur</span>
                            <ChampCopiable valeur={state.data?.user.username ?? ''} />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted">Mot de passe</span>
                            <ChampCopiable valeur={state.data?.password ?? ''} />
                        </div>
                    </>
                ) : erreurRoles ? (
                    <EtatErreur
                        enCours={chargementRoles}
                        onReessayer={() => fetchRole()}
                        quoi="les rôles"
                    />
                ) : (
                    <form action={formAction} className="flex flex-col gap-4">
                        {/* Chaque champ portait un `aria-label` en ANGLAIS — « username
                            input », « prenoms input » — qui REMPLACE le libelle francais
                            pour le lecteur d'ecran. */}
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
                                <>
                                    <input name="role" type="hidden" value={field.value ?? ''} />
                                    <ChampListe
                                        erreur={errors.role?.message}
                                        label="Rôle"
                                        onChange={field.onChange}
                                        options={rolesSelections}
                                        placeholder="Rechercher un rôle"
                                        valeur={field.value ?? ''}
                                    />
                                </>
                            )}
                        />

                        <div className="flex items-center justify-end">
                            <SubmitButton className="w-auto">Ajouter</SubmitButton>
                        </div>
                    </form>
                )}
            </FenetreAction>
        </>
    );
};

export default UsersAdd;
