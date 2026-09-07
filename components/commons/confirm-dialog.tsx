'use client';

import { Button, Modal } from '@heroui-v3/react';

interface Props {
  handleCancel: () => void;
  handleConfirm?: () => void;
  isOpen?: boolean;
  message?: string;
  setIsOpen?: (isOpen: boolean) => void;
}

/**
 * La confirmation courte : « êtes-vous sûr ? », oui, non.
 *
 * <h3>Ce qui change</h3>
 * <p>Le titre était « Confirmation ? » — une question sans objet, qui ne dit ni ce qu'on
 * confirme ni ce qui va se passer. Il annonce maintenant l'acte, et le message reste sous
 * lui.</p>
 *
 * <p>« Oui » était peint en DANGER et « Non » dans la couleur par défaut, quelle que soit
 * l'action confirmée. Or cette fenêtre sert aussi bien à désassigner un livreur qu'à
 * relancer un envoi : le rouge y annonçait une destruction dans tous les cas. Le geste qui
 * engage prend la couleur de l'action principale, et l'appelant peut le marquer
 * destructif quand il l'est vraiment.</p>
 *
 * <p>Les deux boutons disaient « Oui » et « Non » : hors contexte — et c'est le cas quand
 * on relit la fenêtre au lecteur d'écran — deux mots qui ne disent pas à quoi ils
 * répondent.</p>
 */
export const ConfirmDialog = ({
  destructif,
  handleCancel,
  handleConfirm,
  isOpen,
  libelleConfirmer = 'Confirmer',
  message,
  setIsOpen,
  titre = 'Confirmer cette action',
}: Props & { destructif?: boolean; libelleConfirmer?: string; titre?: string }) => (
  <Modal
    isOpen={Boolean(isOpen)}
    onOpenChange={(ouvert) => {
      if (!ouvert) {
        setIsOpen?.(false);
        handleCancel();
      }
    }}
  >
    <Modal.Backdrop>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>{titre}</Modal.Heading>
            <Modal.CloseTrigger />
          </Modal.Header>
          <Modal.Body className="text-sm text-muted">
            {message ?? 'Êtes-vous sûr de vouloir faire cette action ?'}
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={handleCancel} variant="ghost">
              Annuler
            </Button>
            <Button onPress={handleConfirm} variant={destructif ? 'danger' : 'primary'}>
              {libelleConfirmer}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
);
