'use client';

import { Alert } from '@heroui-v3/react';
import React, { useEffect, useState } from 'react';

import { ChampCopiable } from '@/components/commons/ChampCopiable';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { reinitialiserMotDePasseUtilisateur } from '@/src/actions/users.actions';
import { User } from '@/types/models';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Réinitialisation du mot de passe d'un utilisateur, par un administrateur.
 *
 * <p>L'écran de connexion de l'ERP ne propose aucun « mot de passe oublié » : quand
 * quelqu'un perd son accès, c'est le seul chemin pour le lui rendre.</p>
 *
 * <p>Deux temps volontairement séparés. D'abord une confirmation, parce que l'action
 * invalide immédiatement le mot de passe actuel de la personne : la déclencher par erreur
 * met quelqu'un dehors. Ensuite l'affichage du mot de passe provisoire, une seule fois —
 * le serveur ne le conserve qu'en haché et ne saura pas le redonner.</p>
 */
const UsersResetPassword = ({
    user,
    open,
    setOpen,
}: {
    user: User;
    open: boolean;
    setOpen: (open: boolean) => void;
}) => {
    const router = useRouter();
    const [enCours, setEnCours] = useState(false);
    const [motDePasse, setMotDePasse] = useState<string | null>(null);

    useEffect(() => {
        // Le mot de passe ne doit jamais survivre à la fermeture : rouvrir la fenêtre sur
        // un AUTRE utilisateur afficherait sinon l'accès du précédent.
        if (!open) {
            setMotDePasse(null);
            setEnCours(false);
        }
    }, [open]);

    const reinitialiser = async () => {
        setEnCours(true);
        const resultat = await reinitialiserMotDePasseUtilisateur(user.id);
        setEnCours(false);

        if (resultat.status === 'success' && resultat.data?.newPassword) {
            setMotDePasse(resultat.data.newPassword);
            toast.success(resultat.message || 'Mot de passe réinitialisé');
            router.refresh();
        } else {
            toast.error(resultat.message || 'Erreur lors de la réinitialisation du mot de passe');
        }
    };

    const fermer = () => setOpen(false);

    const nom = [user.prenoms, user.nom].filter(Boolean).join(' ') || user.username;

    return (
        <FenetreAction
            destructif
            enAttente={enCours}
            libelleAction={motDePasse ? undefined : 'Réinitialiser'}
            libelleFermer={motDePasse ? "J'ai noté le mot de passe" : 'Annuler'}
            onAction={reinitialiser}
            onFermer={fermer}
            ouvert={open}
            titre={motDePasse ? 'Nouvel accès provisoire' : `Réinitialiser le mot de passe de ${nom}`}
        >
            {motDePasse ? (
                <>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted">Nom d&apos;utilisateur</span>
                        <ChampCopiable valeur={user.username ?? ''} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted">Mot de passe provisoire</span>
                        <ChampCopiable valeur={motDePasse} />
                    </div>
                    <Alert status="warning">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Ce mot de passe ne sera plus jamais affiché</Alert.Title>
                            <Alert.Description>
                                Le serveur ne le conserve que haché : s&apos;il est perdu, il faudra
                                recommencer. Transmettez-le à la personne concernée par un canal sûr.
                                Elle devra choisir son propre mot de passe à sa prochaine connexion.
                            </Alert.Description>
                        </Alert.Content>
                    </Alert>
                </>
            ) : (
                <>
                    <p className="text-sm text-muted">
                        Générer un nouveau mot de passe pour <strong className="text-foreground">{nom}</strong> ?
                    </p>
                    <Alert status="danger">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>
                                Son mot de passe actuel cessera immédiatement de fonctionner
                            </Alert.Title>
                            <Alert.Description>
                                À n&apos;utiliser que si la personne a réellement perdu son accès :
                                l&apos;ERP n&apos;a pas de « mot de passe oublié », donc elle ne pourra pas
                                se dépanner seule.
                            </Alert.Description>
                        </Alert.Content>
                    </Alert>
                </>
            )}
        </FenetreAction>
    );
};

export default UsersResetPassword;
