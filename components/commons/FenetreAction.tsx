'use client';

import { Button, Modal, Spinner } from '@heroui-v3/react';
import React from 'react';

/**
 * La fenêtre d'un geste : un titre, un contenu, un retrait et une action.
 *
 * <h3>Pourquoi ce composant existe</h3>
 * <p>Onze écrans du tableau de bord portaient chacun leur copie de la MÊME coquille de
 * quarante lignes : un `Dialog` de `@headlessui/react` — une TROISIÈME bibliothèque de
 * fenêtres, à côté du `Modal` de HeroUI et de celui de shadcn — enveloppé dans deux
 * `TransitionChild` avec leurs huit classes d'animation recopiées à l'identique, un
 * `DialogPanel` portant la classe `panel` du gabarit d'origine, et une croix de fermeture
 * faite d'un `&lt;button&gt;` nu positionné en absolu.</p>
 *
 * <p>Chacune de ces onze copies avait les mêmes défauts. Le fond était `bg-[black]/60`,
 * une valeur arbitraire écrite en dur. Le bandeau de titre était peint en ROUGE DE MARQUE.
 * Le panneau portait `text-black dark:text-white-dark`, un jeton hérité qui ne suit pas le
 * thème v3. Et les boutons du pied venaient des classes `btn btn-primary` et
 * `btn btn-outline-danger` du gabarit — un « Annuler » en ROUGE à côté d'un bouton
 * d'action neutre, sur toutes les fenêtres, y compris celles où le geste confirmé est,
 * lui, réellement destructif.</p>
 *
 * <p>La croix de fermeture n'avait de nom accessible sur aucune des onze.</p>
 */
export function FenetreAction({
  actionInactive,
  children,
  destructif,
  enAttente,
  libelleAction,
  libelleFermer = 'Annuler',
  onAction,
  onFermer,
  ouvert,
  titre,
}: {
  /**
   * Le geste n'est pas possible en l'etat.
   *
   * <p>Il manquait, et c'est ce qui a produit un bouton MORT sur l'encaissement en lot :
   * faute de pouvoir neutraliser l'action, l'ecran affichait « Encaisser 0 facture(s) »
   * a plein contraste et se contentait de sortir en silence au clic. Un bouton qui a
   * l'air de marcher est pire qu'un bouton grise.</p>
   */
  actionInactive?: boolean;
  children: React.ReactNode;
  /** Le geste détruit ou retire quelque chose : il prend la couleur du danger. */
  destructif?: boolean;
  enAttente?: boolean;
  /** Absent : la fenêtre n'a pas de bouton d'action, seulement un retrait. */
  libelleAction?: string;
  /**
   * Libellé du retrait. « Annuler » convient quand il y a un geste à côté ; quand la
   * fenêtre ne fait plus qu'informer, c'est un accusé de lecture qu'il faut écrire —
   * « J'ai noté le mot de passe » plutôt qu'« Annuler ».
   */
  libelleFermer?: string;
  onAction?: () => void;
  onFermer: () => void;
  ouvert: boolean;
  titre: string;
}) {
  return (
    <Modal isOpen={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg">
            <Modal.Header>
              <Modal.Heading>{titre}</Modal.Heading>
              {/*
                * La croix suit l'attente, comme les deux boutons du pied.
                *
                * <p>Elle restait a plein contraste et cliquable pendant qu'une action
                * tournait. Elle appelle `onFermer`, que les ecrans ignorent dans cet
                * etat : un controle vivant a l'oeil, inerte en fait, sur les quatorze
                * fenetres qui montent cette coquille.</p>
                */}
              <Modal.CloseTrigger isDisabled={enAttente} />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">{children}</Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={enAttente}
                onPress={onFermer}
                variant={libelleAction ? 'ghost' : 'primary'}
              >
                {libelleFermer}
              </Button>
              {libelleAction && (
                /*
                 * L'attente se VOIT.
                 *
                 * <p>`isPending` rend le bouton inerte, mais son apparence bougeait trop
                 * peu pour qu'on s'en apercoive : « Supprimer definitivement » gardait
                 * exactement le meme aspect et cessait simplement de repondre. Un rond
                 * d'attente le dit, comme sur le formulaire de connexion.</p>
                 */
                <Button
                  isDisabled={actionInactive}
                  isPending={enAttente}
                  onPress={onAction}
                  variant={destructif ? 'danger' : 'primary'}
                >
                  {({ isPending }: { isPending: boolean }) => (
                    <>
                      {isPending && <Spinner color="current" size="sm" />}
                      {libelleAction}
                    </>
                  )}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
