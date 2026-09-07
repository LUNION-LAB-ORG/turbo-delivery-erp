'use client';

import { Button, Modal } from '@heroui-v3/react';
import React from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { Restaurant } from '@/types/models';

interface ValidateDialogProps {
  demandeAssignationId: string;
  estAccorder?: boolean;
  isOpen: boolean;
  nomComplet: string;
  onClose: () => void;
  rejeter: (demandeAssignationId: string) => void;
  restaurants: Restaurant[];
  setRestaurantId: (id: string) => void;
  valider: (demandeAssignationId: string) => void;
}

/**
 * Traiter une demande d'assignation : accepter, ou rejeter.
 *
 * <h3>Ce qui change</h3>
 * <p>Les deux couleurs étaient INVERSÉES par rapport à leur sens. « Accepter » — la
 * validation — était peint en `bg-red-500 text-white` avec son survol en `bg-red-600` ;
 * « Rejeter » — le refus définitif d'une demande — portait un gris neutre. L'opérateur
 * pressé voyait un bouton rouge et un bouton gris, et le rouge était le bon choix.</p>
 *
 * <p>Le titre était en `text-red-600` et vivait dans le corps de la fenêtre, pas dans son
 * en-tête : la fenêtre n'avait donc pas d'en-tête du tout, donc pas de croix de
 * fermeture ni de titre annoncé aux lecteurs d'écran.</p>
 *
 * <p>La liste des restaurants n'était pas cherchable, et son libellé disait
 * « Selectionnée un restaurant ».</p>
 */
export default function ValidateDialog({
  demandeAssignationId,
  estAccorder,
  isOpen,
  nomComplet,
  onClose,
  rejeter,
  restaurants,
  setRestaurantId,
  valider,
}: ValidateDialogProps) {
  const [restaurantChoisi, setRestaurantChoisi] = React.useState('');

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Demande d’assignation</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-3">
              {estAccorder ? (
                <p className="text-sm text-foreground">
                  Autoriser le livreur <span className="font-semibold">{nomComplet}</span> à
                  circuler sans rattachement.
                </p>
              ) : (
                <>
                  <p className="text-sm text-foreground">
                    Rattacher le livreur <span className="font-semibold">{nomComplet}</span> à un
                    établissement :
                  </p>
                  <ChampListe
                    label="Établissement"
                    onChange={(v) => {
                      setRestaurantChoisi(v);
                      setRestaurantId(v);
                    }}
                    options={restaurants.map((r) => ({
                      label: r.nomEtablissement,
                      value: r.id,
                    }))}
                    placeholder="Rechercher un établissement"
                    valeur={restaurantChoisi}
                  />
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                onPress={() => {
                  rejeter(demandeAssignationId);
                  onClose();
                }}
                variant="danger-soft"
              >
                Rejeter
              </Button>
              <Button onPress={() => valider(demandeAssignationId)} variant="primary">
                {estAccorder ? 'Accorder' : 'Accepter'}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
