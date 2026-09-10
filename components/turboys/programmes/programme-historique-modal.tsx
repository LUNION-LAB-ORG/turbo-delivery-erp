'use client';

import { Button, Modal, Spinner } from '@heroui-v3/react';
import React from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import type { IAuditAction } from '@/features/supervision/types';
import { useHistoriqueProgrammeQuery } from '@/features/turboys/queries/programme.query';
import type { IProgramme } from '@/features/turboys/types/programme.types';
import { cn } from '@/lib/utils';
import { formatMontant } from '@/utils/format.utils';

/**
 * L'histoire d'un programme : qui a changé quoi, et quand.
 *
 * <p>La direction l'a demandé avec la duplication : une semaine copiée puis retouchée
 * ligne par ligne doit garder la trace de chaque retouche, le carburant en premier. Le
 * journal d'audit du serveur porte déjà ces écritures ; il les résume désormais jour par
 * jour au lieu de compter des éléments, et cette fenêtre les lit pour un seul programme.</p>
 */

const CHAMPS: Record<string, string> = {
  accepteLe: 'Accepté le',
  annee: 'Année',
  jours: 'Jours',
  livreur: 'Livreur',
  montantCarburantHebdo: 'Carburant figé',
  motifRefus: 'Motif du refus',
  nbRelances: 'Relances',
  publieLe: 'Publié le',
  publiePar: 'Publié par',
  refuseLe: 'Refusé le',
  semaine: 'Semaine',
  sitePartnerId: 'Site de la semaine',
  sourceProgramme: 'Source',
  statutProgramme: 'Statut',
  whatsappDetail: 'WhatsApp, détail',
  whatsappLe: 'WhatsApp le',
  whatsappStatut: 'WhatsApp',
};

const STATUTS: Record<string, string> = {
  ACCEPTE: 'Accepté',
  BROUILLON: 'Brouillon',
  NOTIFIE: 'Publié',
  PLANIFIE: 'Planifié',
  REFUSE: 'Refusé',
};

const WHATSAPP: Record<string, string> = {
  ECHEC: 'échec',
  ENVOYE: 'envoyé',
  NON_CONFIGURE: 'non configuré',
  SANS_NUMERO: 'sans numéro',
};

/** Les champs qu'on montre à la création : le reste est du remplissage technique. */
const CHAMPS_CREATION = new Set(['jours', 'sitePartnerId', 'statutProgramme']);

const dateLongue = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('fr-FR', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: '2-digit', year: 'numeric' });
};

export function libelleAction(a: IAuditAction): string {
  if (a.typeAction === 'CREATION') return (a.chemin ?? '').endsWith('/dupliquer') ? 'Créé par duplication de la semaine précédente' : 'Créé';
  if (a.typeAction === 'SUPPRESSION') return 'Supprimé';
  const chemin = a.chemin ?? '';
  if (chemin.endsWith('/publier')) return 'Publié';
  if (chemin.endsWith('/envoyer')) return 'Envoyé au livreur';
  if (chemin.endsWith('/planifier')) return 'Planifié';
  if (chemin.endsWith('/whatsapp')) return 'Renvoyé par WhatsApp';
  if (chemin.endsWith('/accepter')) return 'Accepté par le livreur';
  if (chemin.endsWith('/refuser')) return 'Refusé par le livreur';
  return 'Modifié';
}

function valeur(champ: string, v: unknown, sites?: ReadonlyMap<string, string>): string {
  if (v === null || v === undefined || v === '') return '—';
  switch (champ) {
    case 'montantCarburantHebdo':
      return typeof v === 'number' ? formatMontant(v) : formatMontant(Number(v));
    case 'statutProgramme':
      return STATUTS[String(v)] ?? String(v);
    case 'whatsappStatut':
      return WHATSAPP[String(v)] ?? String(v);
    case 'sitePartnerId':
      return sites?.get(String(v)) ?? String(v);
    case 'publieLe':
    case 'accepteLe':
    case 'refuseLe':
    case 'whatsappLe':
      return dateLongue(String(v));
    case 'livreur':
      return 'Livreur';
    default:
      return String(v);
  }
}

/**
 * Les jours, un par ligne, ceux qui changent en gras. Le serveur les résume sous la forme
 * « LUN 08:00-17:00 4000 F [KFC Angré] ; MAR repos ; … ».
 */
function Jours({ avant, apres }: { avant?: string; apres?: string }) {
  const parJour = (s?: string) => new Map((s ?? '').split(' ; ').filter(Boolean).map((l) => [l.slice(0, 3), l]));
  const a = parJour(avant);
  const b = parJour(apres);
  const cles = Array.from(new Set([...a.keys(), ...b.keys()]));
  return (
    <ul className="flex flex-col gap-0.5">
      {cles.map((k) => {
        const change = a.get(k) !== b.get(k);
        return (
          <li className={cn('grid grid-cols-2 gap-3 text-xs tabular-nums', change ? 'font-semibold text-foreground' : 'text-muted')} key={k}>
            <span>{a.get(k) ?? '—'}</span>
            <span>{b.get(k) ?? '—'}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** La liste, telle qu'elle se lit : une entrée par écriture, les champs changés dessous. */
export function HistoriqueProgramme({ actions, sites }: { actions: IAuditAction[]; sites?: ReadonlyMap<string, string> }) {
  if (actions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Aucune modification enregistrée pour ce programme.</p>;
  }
  return (
    <ol className="flex flex-col divide-y divide-separator">
      {actions.map((a) => {
        const creation = a.typeAction === 'CREATION';
        const champs = Array.from(new Set([...Object.keys(a.valeursAvant ?? {}), ...Object.keys(a.valeursApres ?? {})])).filter(
          (c) => !creation || CHAMPS_CREATION.has(c),
        );
        return (
          <li className="flex flex-col gap-2 py-3" key={a.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <span className="text-sm font-medium text-foreground">{libelleAction(a)}</span>
              <span className="text-xs text-muted">
                {dateLongue(a.occurredAt)}
                {a.utilisateur ? ` · ${a.utilisateur}` : ' · système'}
              </span>
            </div>
            {!a.succes && a.erreur && <p className="text-xs text-danger-soft-foreground">{a.erreur}</p>}
            {champs.length > 0 && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                {champs.map((c) => (
                  <React.Fragment key={c}>
                    <dt className="text-xs text-muted">{CHAMPS[c] ?? c}</dt>
                    <dd className="min-w-0">
                      {c === 'jours' ? (
                        <Jours apres={a.valeursApres?.[c] as string | undefined} avant={a.valeursAvant?.[c] as string | undefined} />
                      ) : creation ? (
                        <span className="text-xs text-foreground">{valeur(c, a.valeursApres?.[c], sites)}</span>
                      ) : (
                        <span className="text-xs tabular-nums">
                          <span className="text-muted">{valeur(c, a.valeursAvant?.[c], sites)}</span>
                          <span className="text-muted"> puis </span>
                          <span className="font-semibold text-foreground">{valeur(c, a.valeursApres?.[c], sites)}</span>
                        </span>
                      )}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function ProgrammeHistoriqueModal({
  isOpen,
  onOpenChange,
  programme,
  sites,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  programme: IProgramme | null;
  /** Identifiant de site vers son nom, pour lire un changement de site. */
  sites?: ReadonlyMap<string, string>;
}) {
  const q = useHistoriqueProgrammeQuery(isOpen ? programme?.id : null);
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-2xl">
            <Modal.Header>
              <div className="flex flex-col gap-0.5">
                <Modal.Heading>Historique du programme</Modal.Heading>
                <span className="text-sm text-muted">
                  {programme?.livreurNom ?? '—'} · semaine {programme?.semaine} / {programme?.annee}
                </span>
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body>
              {q.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="sm" />
                </div>
              ) : q.isError ? (
                <EtatErreur enCours={q.isFetching} onReessayer={() => void q.refetch()} quoi="l’historique du programme" />
              ) : (
                <HistoriqueProgramme actions={Array.isArray(q.data) ? q.data : []} sites={sites} />
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button onPress={() => onOpenChange(false)} variant="ghost">
                Fermer
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
