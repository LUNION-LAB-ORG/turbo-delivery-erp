'use client';

import { Button, Modal } from '@heroui-v3/react';
import { Controller } from 'react-hook-form';

import { ChampDate, ChampListe } from '@/components/commons/champs-formulaire';
import { Restaurant } from '@/types/models';

import { useReportingController } from './controller';

/**
 * Export des bons de livraison d'un restaurant, sur une plage de dates.
 *
 * <h3>Ce qui change</h3>
 * <p>La fenêtre n'avait pas de titre : une ligne centrée peinte en ROUGE DE MARQUE en
 * tenait lieu. Elle n'était donc le titre de rien pour un lecteur d'écran, et le rouge y
 * disait « attention » sur un écran qui ne fait qu'imprimer. Le titre est un titre, le
 * nom du restaurant est descendu dans le corps, et la fenêtre a sa croix de fermeture.</p>
 *
 * <p>Le bouton « Prévisualiser » portait `disabled`, l'attribut HTML — que le bouton de
 * la bibliothèque n'écoute pas. Il se comportait donc comme s'il était actif alors que la
 * prévisualisation ne sait rendre que du PDF : choisir EXCEL puis prévisualiser ouvrait un
 * onglet sur un fichier illisible. C'est `isDisabled`, et la raison est écrite à côté.</p>
 *
 * <p>Le type de commission s'affichait dans une liste déroulante DÉSACTIVÉE contenant une
 * seule entrée : un contrôle qui n'en est pas un, et qui affichait la valeur brute de
 * l'énumération. C'est du texte.</p>
 *
 * <p>Le choix du format était précédé d'un intitulé écrit à la main, et le champ lui-même
 * portait `label="id"` — mot rendu tel quel à l'écran, sous l'intitulé. Un seul libellé
 * reste, porté par le champ.</p>
 *
 * <p>Les deux sélecteurs de date répétaient dix lignes identiques pour convertir leur
 * valeur ; l'attente était signalée par un rond posé en `top-[40%] left-[45%]`, valeurs
 * choisies à l'œil. Les dates passent par le champ partagé, l'attente par les boutons.</p>
 *
 * <p>Restaient trois fautes dans le texte affiché : « Previsuliser », « Date de debut »,
 * « Selectionnez ».</p>
 */

interface Props {
  initialiType?: string;
  isOpen?: boolean;
  onClose: () => void;
  restaurant?: Restaurant;
  type?: string;
}

export function TicketTermineReportingDialog({
  initialiType,
  isOpen,
  onClose,
  restaurant,
  type,
}: Props) {
  const ctrl = useReportingController(restaurant, type, initialiType);
  const format = ctrl.form.watch('format');
  const apercuImpossible = format === 'EXCEL';

  return (
    <Modal isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-md">
            <Modal.Header>
              <Modal.Heading>Imprimer les bons de livraison</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                Restaurant{' '}
                <span className="font-semibold text-foreground">
                  {restaurant ? restaurant.nomEtablissement : 'aucun restaurant sélectionné'}
                </span>
              </p>

              <Controller
                control={ctrl.form.control}
                name="debut"
                render={({ field }) => (
                  <ChampDate label="Date de début" onChange={field.onChange} valeur={field.value} />
                )}
              />
              <Controller
                control={ctrl.form.control}
                name="fin"
                render={({ field }) => (
                  <ChampDate label="Date de fin" onChange={field.onChange} valeur={field.value} />
                )}
              />

              {type && type !== 'commande-terminer' ? (
                <div>
                  <p className="text-sm text-muted">Type</p>
                  <p className="text-sm font-semibold text-foreground">{type}</p>
                </div>
              ) : null}

              <Controller
                control={ctrl.form.control}
                name="format"
                render={({ field }) => (
                  <ChampListe
                    label="Format"
                    onChange={field.onChange}
                    options={[
                      { label: 'PDF', value: 'PDF' },
                      { label: 'EXCEL', value: 'EXCEL' },
                    ]}
                    placeholder="PDF ou EXCEL"
                    valeur={field.value ?? ''}
                  />
                )}
              />

              {apercuImpossible ? (
                <p className="text-xs text-muted">
                  La prévisualisation ne rend que le PDF. Le format EXCEL se télécharge.
                </p>
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button
                isDisabled={apercuImpossible || ctrl.isLoading}
                onPress={ctrl.onPreview}
                variant="ghost"
              >
                Prévisualiser
              </Button>
              <Button isPending={ctrl.isLoading} onPress={ctrl.onexportFile} variant="primary">
                Exporter
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
