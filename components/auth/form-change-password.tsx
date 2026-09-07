'use client';

import { Modal } from '@heroui-v3/react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { toast } from 'sonner';

import { ChampMotDePasse } from '@/components/commons/champs-formulaire';
import { SubmitButton } from '@/components/ui/form-ui/submit-button';
import { changePassword } from '@/src/actions/users.actions';

/**
 * Changement de mot de passe obligatoire, à la première connexion.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenêtre s'ouvrait sur `isOpen={true}` en dur, sans fermeture : c'est voulu, le
 * changement est imposé, mais rien ne le DISAIT. L'opérateur tombait sur une fenêtre
 * qu'il ne pouvait pas quitter et devait le deviner. C'est écrit maintenant.</p>
 *
 * <p>Trois champs de mot de passe, dont deux à faire correspondre, et aucun moyen de
 * relire ce qu'on tape : une faute de frappe ne se voyait qu'après l'aller-retour au
 * serveur. Les champs viennent maintenant de `ChampMotDePasse`, celui des autres
 * formulaires, qui porte son bouton « afficher ».</p>
 *
 * <p>Aucun champ ne déclarait d'`autoComplete` : les gestionnaires de mots de passe ne
 * pouvaient ni remplir l'ancien, ni proposer d'enregistrer le nouveau. Ils le peuvent.</p>
 *
 * <p>`isRequired required` était posé deux fois sur chaque champ : l'attribut HTML brut
 * à côté de la propriété du composant, qui le pose déjà. Le doublon est retiré. La
 * validation reste celle du navigateur — vérifié dans le DOM, `required` est bien là :
 * ce formulaire n'a pas de contrôleur côté client, c'est le serveur qui juge, et la
 * seule règle qu'on peut tenir ici sans la dédoubler est « non vide ».</p>
 */

export function FormChangePassword({ userName }: { userName: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (_: any, formData: FormData) => {
      formData.set('username', userName);
      const result = await changePassword(formData);

      if (result.status === 'success') {
        toast.success(result.message || 'Bravo ! vous avez réussi');
        router.push('/');
        router.refresh();
      } else {
        toast.error(result.message || "Erreur lors de l'envoi de l'email");
      }

      return result;
    },
    { code: undefined, data: null, errors: {}, message: '', status: 'idle' },
  );

  return (
    <Modal isOpen>
      {/* Le changement est imposé : la fenêtre ne se ferme ni au clic dehors, ni par une
          croix. C'est le seul cas de l'ERP où une fenêtre n'a pas d'échappatoire, et la
          phrase sous le titre dit pourquoi. */}
      <Modal.Backdrop isDismissable={false}>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.Header>
              <Modal.Heading>Nouveau mot de passe</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-4 text-sm text-muted">
                Votre compte utilise encore le mot de passe qui vous a été remis. Choisissez-en un
                autre pour continuer.
              </p>
              <form action={formAction} className="flex flex-col gap-4">
                <ChampMotDePasse
                  autoComplete="current-password"
                  erreur={state?.errors?.oldPassword}
                  estRequis
                  label="Mot de passe actuel"
                  name="oldPassword"
                />
                <ChampMotDePasse
                  autoComplete="new-password"
                  erreur={state?.errors?.password}
                  estRequis
                  label="Nouveau mot de passe"
                  name="newPassword"
                />
                <ChampMotDePasse
                  autoComplete="new-password"
                  erreur={state?.errors?.confirm_password}
                  estRequis
                  label="Confirmer le nouveau mot de passe"
                  name="confirm_password"
                />
                <SubmitButton className="mt-2 w-full">Enregistrer</SubmitButton>
              </form>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
