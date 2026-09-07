'use client';

import { useEffect, useState } from 'react';
import { Button, Label, Modal, NumberField, Radio, RadioGroup } from '@heroui-v3/react';

import { ChampZoneTexte } from '@/components/commons/champs-formulaire';
import { PhoneCall, PhoneMissed } from 'lucide-react';

import { useConsignerAppelMutation } from '../queries/chat-partenaires.query';

interface ConsignerAppelModalProps {
  restaurantId: string | null;
  restaurantNom: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Consigne un appel téléphonique passé à un partenaire depuis le poste
 * STANDARD : abouti ou manqué, durée facultative, commentaire libre.
 * L'appel consigné alimente le journal de la demande de coursier.
 */
export function ConsignerAppelModal({ restaurantId, restaurantNom, isOpen, onOpenChange }: ConsignerAppelModalProps) {
  const consigner = useConsignerAppelMutation();

  const [abouti, setAbouti] = useState<'oui' | 'non'>('oui');
  const [minutes, setMinutes] = useState('');
  const [secondes, setSecondes] = useState('');
  const [commentaire, setCommentaire] = useState('');

  // Chaque ouverture repart d'une fiche vierge : on consigne UN appel.
  useEffect(() => {
    if (isOpen) {
      setAbouti('oui');
      setMinutes('');
      setSecondes('');
      setCommentaire('');
    }
  }, [isOpen]);

  const duree = (() => {
    const m = parseInt(minutes, 10);
    const s = parseInt(secondes, 10);
    const total = (Number.isFinite(m) ? m * 60 : 0) + (Number.isFinite(s) ? s : 0);
    return total > 0 ? total : undefined;
  })();

  const enregistrer = () => {
    if (!restaurantId) return;
    consigner.mutate(
      {
        restaurantId,
        dto: {
          abouti: abouti === 'oui',
          ...(abouti === 'oui' && duree !== undefined ? { dureeSecondes: duree } : {}),
          ...(commentaire.trim() ? { commentaire: commentaire.trim() } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <div className="flex flex-col gap-0.5">
                {/* Le titre etait peint en ROUGE DE MARQUE. */}
                <Modal.Heading>Consigner un appel</Modal.Heading>
                <span className="text-sm text-muted">{restaurantNom}</span>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              {/*
               * Les deux choix etaient des `<Radio>` dont le libelle etait un `<span>`
               * enfant : la v3 attend `Radio.Content` avec sa pastille explicite, sans
               * quoi le bouton radio ne se dessine pas du tout.
               */}
              <RadioGroup
                onChange={(v) => setAbouti(v as 'non' | 'oui')}
                orientation="horizontal"
                value={abouti}
              >
                <Radio value="oui">
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <span className="flex items-center gap-1.5">
                      <PhoneCall aria-hidden="true" className="size-4 text-success" />
                      Abouti
                    </span>
                  </Radio.Content>
                </Radio>
                <Radio value="non">
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <span className="flex items-center gap-1.5">
                      <PhoneMissed aria-hidden="true" className="size-4 text-danger" />
                      Manqué
                    </span>
                  </Radio.Content>
                </Radio>
              </RadioGroup>

              {abouti === 'oui' && (
                <div className="flex items-end gap-2">
                  {/*
                   * Le champ des SECONDES n'avait pas de libelle visible — seulement un
                   * `aria-label` — a cote d'un champ « Duree » qui, lui, en avait un. Deux
                   * cases identiques ou une seule etait nommee : rien a l'ecran ne disait
                   * laquelle comptait les minutes.
                   */}
                  <div className="max-w-[130px]">
                    <NumberField
                      minValue={0}
                      onChange={(v) => setMinutes(Number.isNaN(v) ? '' : String(v))}
                      value={minutes === '' ? Number.NaN : Number(minutes)}
                    >
                      <Label>Minutes</Label>
                      <NumberField.Group>
                        <NumberField.Input />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                  <div className="max-w-[130px]">
                    <NumberField
                      maxValue={59}
                      minValue={0}
                      onChange={(v) => setSecondes(Number.isNaN(v) ? '' : String(v))}
                      value={secondes === '' ? Number.NaN : Number(secondes)}
                    >
                      <Label>Secondes</Label>
                      <NumberField.Group>
                        <NumberField.Input />
                      </NumberField.Group>
                    </NumberField>
                  </div>
                </div>
              )}

              <ChampZoneTexte
                label="Commentaire"
                onChange={setCommentaire}
                placeholder="Motif de l'appel, suite à donner…"
                valeur={commentaire}
              />
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={() => onOpenChange(false)} variant="ghost">
                Annuler
              </Button>
              <Button
                isDisabled={!restaurantId}
                isPending={consigner.isPending}
                onPress={enregistrer}
                variant="primary"
              >
                Enregistrer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
