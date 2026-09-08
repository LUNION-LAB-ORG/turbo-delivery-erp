'use client';

import { createTypePlat } from '@/src/actions/type-plats.actions';
import { _createTypePlatSchema, createTypePlatSchema } from '@/src/schemas/type-plats.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Label } from '@heroui-v3/react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { ChampTexte, ChampZoneTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { useActionState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';

const TypePlatAdd = () => {
    const [open, setOpen] = useState<boolean>(false);
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
    const router = useRouter();

    const [state, formAction] = useActionState(
        async (prevState: any, formData: FormData) => {
            const result = await createTypePlat(formData);

            if (result.status === 'success') {
                toast.success(result.message || 'Bravo ! vous avez réussi');
                router.refresh();
                setOpen(false);
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

    const {
        formState: { errors },
        control,
    } = useForm<_createTypePlatSchema>({
        resolver: zodResolver(createTypePlatSchema),
        defaultValues: {
            libelle: '',
            description: '',
            picture: undefined,
        },
    });

    return (
        <>
            {/* C'etait un `<button className="btn btn-primary">` du gabarit d'origine, avec
                une icone « ajouter un UTILISATEUR » sur l'ecran des types de plat. */}
            <Button onPress={() => setOpen(true)} variant="primary">
                <Plus aria-hidden="true" className="size-4" />
                Ajouter un type de plat
            </Button>

            <FenetreAction
                onFermer={() => {
                    setOpen(false);
                    router.refresh();
                }}
                ouvert={open}
                titre="Ajouter un type de plat"
            >
                <form action={formAction} className="flex flex-col gap-4">
                    <Controller
                        control={control}
                        name="libelle"
                        render={({ field }) => (
                            <>
                                <input name="libelle" type="hidden" value={field.value ?? ''} />
                                <ChampTexte
                                    erreur={errors.libelle?.message}
                                    label="Libellé"
                                    onChange={field.onChange}
                                    placeholder="Entrez le libellé"
                                    valeur={field.value ?? ''}
                                />
                            </>
                        )}
                    />
                    <Controller
                        control={control}
                        name="description"
                        render={({ field }) => (
                            <>
                                <input name="description" type="hidden" value={field.value ?? ''} />
                                <ChampZoneTexte
                                    erreur={errors.description?.message}
                                    label="Description"
                                    onChange={field.onChange}
                                    placeholder="Entrez la description"
                                    valeur={field.value ?? ''}
                                />
                            </>
                        )}
                    />
                    {/*
                     * L'image passait par un `Input` de texte ordinaire, ou l'on tapait une
                     * URL a la main. C'est un fichier : le champ le dit, et le navigateur
                     * ouvre le selecteur.
                     */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Image</Label>
                        <input
                            accept="image/*"
                            className="text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-separator file:bg-surface-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
                            name="picture"
                            type="file"
                        />
                        {errors.picture?.message && (
                            <span className="text-xs text-danger">{errors.picture.message}</span>
                        )}
                    </div>

                    <div className="flex items-center justify-end">
                        {/* Le bouton d'envoi de la fenetre d'AJOUT disait « Modifier ». */}
                        <SubmitButton className="w-auto">Ajouter</SubmitButton>
                    </div>
                </form>
            </FenetreAction>
        </>
    );
};

export default TypePlatAdd;
