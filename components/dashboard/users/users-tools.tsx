'use client';

import { User } from '@/types/models';
import UsersEdit from './users-edit';
import { Button, Dropdown } from '@heroui-v3/react';
import { useState } from 'react';
import { IconDotsVertical } from '@tabler/icons-react';
import UsersDeleteRestaure from './users-delete-restaure';
import UsersDisableEnable from './users-disable-enable';
import UsersResetPassword from './users-reset-password';
import { useAbility } from '@/hooks/use-ability';

const UsersTools = ({ user, value }: { user: User; value: 'list' | 'grid' }) => {
    const [open, setOpen] = useState<boolean>(false);
    const [openDelete, setOpenDelete] = useState<boolean>(false);
    const [openDisableEnable, setOpenDisableEnable] = useState<boolean>(false);
    const [openResetPassword, setOpenResetPassword] = useState<boolean>(false);
    const ability = useAbility();
    const canUpdate = ability.can('update', 'Utilisateur');
    const canDelete = ability.can('delete', 'Utilisateur');
    const nom = [user.prenoms, user.nom].filter(Boolean).join(' ') || user.username;

    return (
        <>
            {value === 'list' && (
                /*
                 * `Dropdown.Trigger` rend son PROPRE bouton : le `Button` est enfant DIRECT
                 * du `Dropdown`, faute de quoi on obtient un bouton dans un bouton. Et il
                 * n'avait aucun nom accessible — quatre gestes derriere trois points muets.
                 */
                <Dropdown>
                    <Button aria-label={`Actions sur ${nom}`} isIconOnly size="sm" variant="ghost">
                        <IconDotsVertical />
                    </Button>
                    <Dropdown.Popover placement="bottom end">
                        <Dropdown.Menu aria-label={`Actions sur ${nom}`}>
                            {canUpdate ? (
                                <Dropdown.Item
                                    id="edit"
                                    onAction={() => setOpen(true)}
                                    textValue="Modifier"
                                >
                                    Modifier
                                </Dropdown.Item>
                            ) : null}
                            {canUpdate ? (
                                <Dropdown.Item
                                    id="resetPassword"
                                    onAction={() => setOpenResetPassword(true)}
                                    textValue="Réinitialiser le mot de passe"
                                >
                                    Réinitialiser le mot de passe
                                </Dropdown.Item>
                            ) : null}
                            {canUpdate ? (
                                <Dropdown.Item
                                    className={user.status ? 'text-danger-soft-foreground' : undefined}
                                    id="disableEnable"
                                    onAction={() => setOpenDisableEnable(true)}
                                    textValue={user.status ? 'Désactiver' : 'Activer'}
                                >
                                    {user.status ? 'Désactiver' : 'Activer'}
                                </Dropdown.Item>
                            ) : null}
                            {canDelete ? (
                                <Dropdown.Item
                                    className={user.deleted ? undefined : 'text-danger-soft-foreground'}
                                    id="delete"
                                    onAction={() => setOpenDelete(true)}
                                    textValue={user.deleted ? 'Restaurer' : 'Supprimer'}
                                >
                                    {user.deleted ? 'Restaurer' : 'Supprimer'}
                                </Dropdown.Item>
                            ) : null}
                        </Dropdown.Menu>
                    </Dropdown.Popover>
                </Dropdown>
            )}

            {value === 'grid' && (
                /*
                 * Les QUATRE boutons de la vue en grille venaient des classes du gabarit
                 * d'origine : `btn-outline-danger` sur « Supprimer » comme sur
                 * « Desactiver », et `btn-outline-primary` — le rouge de marque — sur
                 * « Modifier » et « Mot de passe ». Quatre boutons rouges cote a cote, dont
                 * deux ne detruisent rien.
                 */
                <div className="absolute bottom-0 left-0 mt-6 flex w-full flex-wrap gap-2 p-6">
                    {canDelete && (
                        <Button
                            onPress={() => setOpenDelete(true)}
                            size="sm"
                            variant={user.deleted ? 'outline' : 'danger-soft'}
                        >
                            {user.deleted ? 'Restaurer' : 'Supprimer'}
                        </Button>
                    )}
                    {canUpdate && (
                        <Button
                            onPress={() => setOpenDisableEnable(true)}
                            size="sm"
                            variant={user.status === 1 ? 'danger-soft' : 'outline'}
                        >
                            {user.status === 1 ? 'Désactiver' : 'Activer'}
                        </Button>
                    )}
                    {canUpdate && (
                        <Button onPress={() => setOpen(true)} size="sm" variant="outline">
                            Modifier
                        </Button>
                    )}
                    {canUpdate && (
                        <Button onPress={() => setOpenResetPassword(true)} size="sm" variant="outline">
                            Mot de passe
                        </Button>
                    )}
                </div>
            )}

            <UsersEdit open={open} setOpen={setOpen} user={user} />
            <UsersDeleteRestaure open={openDelete} setOpen={setOpenDelete} user={user} />
            <UsersDisableEnable open={openDisableEnable} setOpen={setOpenDisableEnable} user={user} />
            <UsersResetPassword open={openResetPassword} setOpen={setOpenResetPassword} user={user} />
        </>
    );
};

export default UsersTools;
