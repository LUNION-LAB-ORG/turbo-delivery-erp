import React from 'react';
import { Button, Modal } from '@heroui-v3/react';
import { SelectField } from '@/components/commons/form/select-field';
import { LivreurStatutVM, Restaurant } from '@/types/models';
import { useUpdateDeliveryManController } from './controler';

interface Props {
  restaurants: Restaurant[] | null;
  isOpen: boolean;
  onClose: () => void;
  livreur?: LivreurStatutVM | null;
  nomLivreur?: string;
  typeLiveur?: string;
  isReassign?: boolean;
  title?: string;
  onSuccess?: () => void;
}
export function UpdateDeliveryDialog({ restaurants, isOpen, onClose, livreur, typeLiveur, isReassign, title, onSuccess }: Props) {
  const ctrl = useUpdateDeliveryManController(livreur, typeLiveur, onClose, isReassign, onSuccess);
  const headerTitle = title ?? (isReassign ? 'Réassigner le livreur' : 'Changer le statut du livreur');
  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              {/* Le nom du livreur etait ecrit en ROUGE DE MARQUE au milieu du titre :
                  c'est le SUJET de la fenetre, pas une alerte. */}
              <Modal.Heading>
                {headerTitle} : <b className="text-foreground">{livreur?.nomPrenom}</b>
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              <SelectField
                label="nomEtablissement"
                options={restaurants || []}
                placeholder="Rechercher un restaurant"
                setValue={ctrl.setRestuarantSelect}
                value={ctrl.restaurantSelected}
              />
            </Modal.Body>
            <Modal.Footer>
              {/* « Annuler » etait ROUGE : se raviser n'est pas un geste dangereux. */}
              <Button onPress={onClose} variant="ghost">
                Annuler
              </Button>
              <Button onPress={ctrl.changerRestaurantLivreurs} variant="primary">
                Enregistrer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
