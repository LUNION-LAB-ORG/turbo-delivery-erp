'use client';

import React from 'react';
import { Button, Modal, Tooltip } from '@heroui-v3/react';
import { Download, MessageCircle, Send } from 'lucide-react';

import { IProgramme } from '@/features/turboys/types/programme.types';
import { useEnvoyerProgrammeMutation } from '@/features/turboys/queries/programme.query';
import { libelleJourInactif } from '@/features/turboys/utils/jour.utils';
import { lienWhatsApp, texteProgramme } from '@/features/turboys/utils/partage-whatsapp.utils';
import { exporterProgrammeIndividuelPdf } from '@/features/turboys/utils/programmes-export.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';

const JOURS: Array<{ key: string; label: string }> = [
  { key: 'LUNDI', label: 'Lundi' },
  { key: 'MARDI', label: 'Mardi' },
  { key: 'MERCREDI', label: 'Mercredi' },
  { key: 'JEUDI', label: 'Jeudi' },
  { key: 'VENDREDI', label: 'Vendredi' },
  { key: 'SAMEDI', label: 'Samedi' },
  { key: 'DIMANCHE', label: 'Dimanche' },
];

const hhmm = (t?: string | null) => (t ?? '').slice(0, 5);

interface Props {
  programme: IProgramme | null;
  annee: number;
  semaine: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Le numéro du livreur, pour ouvrir la conversation WhatsApp. Absent : pas de bouton actif. */
  telephone?: string | null;
}

/**
 * Aperçu « Programme individuel » (maquette M2) : la semaine d'un livreur en
 * lecture, avec export PDF mono-livreur.
 *
 * <h3>Partager sur WhatsApp</h3>
 * <p>« Envoyer au livreur » notifie l'application, que personne n'a encore installée,
 * et aucun SMS ne part. Le programme se transmet donc à la main, et c'est sur WhatsApp
 * que ça se fait. Le bouton ouvre la conversation avec le message écrit ; l'envoi reste
 * un geste humain. Le message ne dit rien du carburant.</p>
 */
export function ProgrammeApercuModal({ programme, annee, semaine, isOpen, onOpenChange, telephone = null }: Props) {
  const prenom = (programme?.livreurNom ?? '').split(' ')[0] || 'Bonjour';
  const envoyer = useEnvoyerProgrammeMutation();
  const lien = programme ? lienWhatsApp(telephone, texteProgramme(programme, annee, semaine)) : null;
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog>
            <Modal.Header>
              <div className="flex flex-col items-start gap-0.5">
                {/* Le titre etait peint en ROUGE DE MARQUE : un intitule de fenetre
                    n'appelle aucune action. */}
                <Modal.Heading>Programme individuel</Modal.Heading>
                <span className="text-sm text-muted">
                  {programme?.livreurNom ?? '—'}
                  {programme?.typeLivreur
                    ? ` · ${getTurboyTypeDisplay(programme.typeLivreur).label}`
                    : ''}{' '}
                  — Semaine {semaine} / {annee}
                </span>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body>
              {programme && (
                <div className="rounded-xl border border-separator p-4">
                  <p className="mb-3 text-sm font-medium text-foreground">
                    {prenom}, voici ton programme cette semaine
                  </p>
                  <ul className="divide-y divide-separator">
                    {JOURS.map((jr) => {
                      const j = programme.jours?.find(
                        (x) => (x.jour ?? '').toUpperCase() === jr.key,
                      );
                      const repos = !j || !j.actif;
                      return (
                        <li
                          className="flex items-center justify-between py-2 text-sm"
                          key={jr.key}
                        >
                          <span className="text-muted">{jr.label}</span>
                          {/*
                           * Le repos etait ecrit en ROUGE. Un jour de repos n'est ni une
                           * erreur ni une alerte : c'est le programme normal d'un livreur,
                           * et sur une semaine a deux repos la fenetre affichait deux
                           * lignes rouges comme si quelque chose n'allait pas.
                           */}
                          {repos ? (
                            <span className="text-muted">{libelleJourInactif(j)}</span>
                          ) : (
                            <span className="font-medium tabular-nums text-foreground">
                              {hhmm(j!.debut)} – {hhmm(j!.fin)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={() => onOpenChange(false)} variant="ghost">
                Fermer
              </Button>
              <Button
                isDisabled={!programme}
                onPress={() =>
                  programme && exporterProgrammeIndividuelPdf(programme, annee, semaine)
                }
                variant="outline"
              >
                <Download aria-hidden="true" className="size-4" />
                Exporter PDF
              </Button>
              <Tooltip>
                <Button
                  isDisabled={!lien}
                  onPress={() => lien && window.open(lien, '_blank', 'noopener,noreferrer')}
                  variant="outline"
                >
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Partager sur WhatsApp
                </Button>
                <Tooltip.Content>
                  {lien
                    ? 'Ouvre la conversation avec le message écrit ; rien ne part sans votre envoi'
                    : 'Aucun numéro à dix chiffres pour ce livreur'}
                </Tooltip.Content>
              </Tooltip>
              <Button
                isDisabled={!programme}
                isPending={envoyer.isPending}
                onPress={() => programme && envoyer.mutate(programme.id)}
                variant="primary"
              >
                <Send aria-hidden="true" className="size-4" />
                Envoyer au livreur
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
