'use client';

import { Button, Link } from '@heroui-v3/react';
import { Check, ChevronLeft, ChevronRight, Download, FileText, Pencil, X } from 'lucide-react';
import { useState } from 'react';

import { Can } from '@/components/auth/Can';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { IDepense } from '@/features/depenses/types/depense.type';
import { createUrlFile } from '@/utils/createUrlFile';
import { formatMontant } from '@/utils/format.utils';

import { StatusBadge, TypeBadge } from './validation-badges';
import { fmtDate } from './validation.constants';
import { WorkflowStepper } from './workflow-stepper';

interface ValidationCardProps {
  depense: IDepense;
  current: number;
  total: number;
  /** Total SERVEUR de la file, quand il depasse les lignes chargees. */
  totalFile?: number;
  onPrev: () => void;
  onNext: () => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit?: () => void;
  acceptLabel: string;
  canAct: boolean;
  isDGA: boolean;
  isPending: boolean;
}

/**
 * La depense en cours d'examen.
 *
 * <h3>Ce que l'operateur regarde, et dans quel ordre</h3>
 * <p>Le dossier occupe desormais une colonne a lui, en regard de la file. Il tient dans la
 * hauteur : l'identite et les pieces defilent au milieu, l'en-tete de position reste en
 * haut et la barre de decision reste EN BAS, sous les yeux. Auparavant la carte etait
 * posee dans le flux de la page, et la barre Viser / Rejeter passait sous la ligne de
 * flottaison des qu'un justificatif s'ajoutait.</p>
 *
 * <h3>Une valeur fabriquee, retiree</h3>
 * <p>« Cree par : Comptable » etait ECRIT EN DUR, quel que soit l'auteur reel. La charge
 * porte pourtant `creerPar` dans sa charge utile ; c'est le mappeur `chargeVariableToDepense`
 * qui le jette, et `IDepense` qui n'a pas de champ pour l'accueillir. Afficher un nom faux
 * est pire que ne rien afficher : le champ disparait jusqu'a ce que le mappeur transporte
 * la vraie valeur.</p>
 *
 * <p>En echange, la description et la source de paiement, deja presentes dans la donnee et
 * visibles seulement dans l'historique, arrivent ici : ce sont elles qui justifient la
 * depense, donc exactement ce sur quoi porte la decision.</p>
 */
export function ValidationCard({ depense, current, total, totalFile, onPrev, onNext, onAccept, onReject, onEdit, acceptLabel, canAct, isDGA, isPending }: ValidationCardProps) {
  const [justificatifOuvert, setJustificatifOuvert] = useState(false);
  // Un justificatif PDF ne s'affiche pas dans une <img> : on bascule sur le lien.
  const [apercuImpossible, setApercuImpossible] = useState(false);

  const titreEtape = acceptLabel === 'Viser' ? 'Validation DGA' : acceptLabel === 'Approuver' ? 'Approbation DG' : 'Décaissement Comptable';

  const lienJustificatif = depense.justificatif ? createUrlFile(depense.justificatif, 'backend') : null;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-large border border-separator bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-separator px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-foreground">{titreEtape}</h2>
          <p className="text-xs text-muted">
            <span className="tabular-nums">
              Dépense {current + 1} sur {total}
            </span>
            {typeof totalFile === 'number' && totalFile > total && <span className="ml-1 tabular-nums">({totalFile} en attente au total)</span>}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button aria-label="Dépense précédente" isDisabled={current === 0} isIconOnly onPress={onPrev} size="sm" variant="ghost">
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button aria-label="Dépense suivante" isDisabled={current === total - 1} isIconOnly onPress={onNext} size="sm" variant="ghost">
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm tabular-nums text-muted">{fmtDate(depense.dateDepense)}</span>
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground">{formatMontant(depense.montant)}</span>
        </div>

        <p className="mb-0.5 font-semibold text-foreground">{depense.libelle}</p>
        <p className="text-sm text-muted">{depense.categorie?.nomCategorie}</p>

        <WorkflowStepper statut={depense.statut} />

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-medium bg-surface-secondary p-3">
          <div className="min-w-0">
            <dt className="text-xs text-muted">Date de création</dt>
            <dd className="text-sm font-medium tabular-nums text-foreground">{fmtDate(depense.createdAt ?? depense.dateDepense)}</dd>
          </div>
          {depense.sourcePaiement && (
            <div className="min-w-0">
              <dt className="text-xs text-muted">Source de paiement</dt>
              <dd className="text-sm font-medium text-foreground">{depense.sourcePaiement}</dd>
            </div>
          )}
          {/* La fiche affichait « Comptable » ecrit en dur, quel que soit l'auteur reel.
              Les trois types sources portent `creerPar` : ce sont les mappeurs qui le
              jetaient. Le champ ne s'affiche que si le backend l'a rempli, plutot que de
              nommer quelqu'un au hasard. */}
          {depense.creerPar && (
            <div className="min-w-0">
              <dt className="text-xs text-muted">Créé par</dt>
              <dd className="text-sm font-medium text-foreground">{depense.creerPar}</dd>
            </div>
          )}
          {depense.description && (
            <div className="col-span-2 min-w-0">
              <dt className="text-xs text-muted">Description</dt>
              <dd className="text-sm font-medium text-foreground">{depense.description}</dd>
            </div>
          )}
          {lienJustificatif && (
            <div className="col-span-2">
              <Button onPress={() => setJustificatifOuvert(true)} size="sm" variant="outline">
                <FileText aria-hidden="true" />
                Voir le justificatif
              </Button>
            </div>
          )}
        </dl>
      </div>

      <FenetreAction libelleFermer="Fermer" onFermer={() => setJustificatifOuvert(false)} ouvert={justificatifOuvert} titre={`Justificatif : ${depense.libelle}`}>
        {lienJustificatif && (
          <>
            <div className="overflow-hidden rounded-lg border border-separator bg-surface-secondary">
              {apercuImpossible ? (
                <Link className="w-full justify-center py-8 text-sm" href={lienJustificatif} rel="noopener noreferrer" target="_blank">
                  <Download aria-hidden="true" className="mr-2 size-4" />
                  Ouvrir le fichier
                </Link>
              ) : (
                <img alt="Justificatif" className="max-h-[60vh] w-full object-contain" onError={() => setApercuImpossible(true)} src={lienJustificatif} />
              )}
            </div>
            <a className="button button--md button--outline button--full-width" href={lienJustificatif} rel="noopener noreferrer" target="_blank">
              <Download aria-hidden="true" />
              Télécharger
            </a>
          </>
        )}
      </FenetreAction>

      {/* La barre de decision : le geste principal porte l'accent, le refus la teinte du
          danger parce qu'il DETRUIT le dossier, la modification reste neutre. */}
      {canAct ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-separator px-4 py-3">
          {isDGA ? (
            <>
              <Can I="rejeter-dga" a="Depense">
                <Button isDisabled={isPending} onPress={() => onReject(depense.id)} size="sm" variant="danger-soft">
                  <X aria-hidden="true" />
                  Rejeter
                </Button>
              </Can>
              {onEdit && (
                <Can I="update" a="Depense">
                  <Button isDisabled={isPending} onPress={onEdit} size="sm" variant="outline">
                    <Pencil aria-hidden="true" />
                    Modifier
                  </Button>
                </Can>
              )}
              <Can I="valider-dga" a="Depense">
                <Button isDisabled={isPending} onPress={() => onAccept(depense.id)} size="sm" variant="primary">
                  <Check aria-hidden="true" />
                  Viser
                </Button>
              </Can>
            </>
          ) : (
            <>
              <Button isDisabled={isPending} onPress={() => onReject(depense.id)} size="sm" variant="danger-soft">
                <X aria-hidden="true" />
                Rejeter
              </Button>
              <Button isDisabled={isPending} onPress={() => onAccept(depense.id)} size="sm" variant="primary">
                <Check aria-hidden="true" />
                {acceptLabel}
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-separator py-3">
          <StatusBadge statut={depense.statut} />
        </div>
      )}
    </section>
  );
}
