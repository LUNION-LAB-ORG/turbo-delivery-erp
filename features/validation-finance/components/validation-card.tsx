'use client';

import { Button, Link } from '@heroui-v3/react';
import { Check, ChevronLeft, ChevronRight, Download, FileText, Pencil, X } from 'lucide-react';
import { useState } from 'react';

import { Can } from '@/components/auth/Can';
import { FenetreAction } from '@/components/commons/FenetreAction';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { createUrlFile } from '@/utils/createUrlFile';

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
 * La depense en cours d'examen, dans la file de validation.
 *
 * <h3>Ce qui change</h3>
 * <p>Les six commandes de l'ecran etaient des `<button>` nus habilles a la main. Les deux
 * fleches de navigation n'avaient AUCUN nom accessible : un lecteur d'ecran annoncait
 * deux boutons vides. Le lien vers le justificatif etait un `<div onClick>`, donc
 * inatteignable au clavier. Les trois commandes du pied etaient peintes en
 * `bg-green-500` / `text-red-500` / `text-orange-500`, des couleurs de palette brutes
 * sans equivalent en mode sombre, posees dans une grille dont le nombre de colonnes etait
 * calcule sur `onEdit` mais pas sur les droits CASL : quand un role n'avait pas le droit
 * de rejeter, la grille gardait sa colonne vide et l'arrondi du coin bas gauche partait
 * avec le bouton masque.</p>
 *
 * <p>Le pied suit maintenant la barre d'action du visa DGA, deja refondue : le geste
 * principal en primaire, le refus en `danger-soft`, alignes a droite, et rien ne casse
 * quand un droit manque.</p>
 *
 * <p>Le montant etait peint en couleur d'alerte et la categorie en bleu. Ni l'un ni
 * l'autre n'appelle un geste : le montant reprend la couleur du texte, en chasse
 * tabulaire, et la categorie celle du texte secondaire.</p>
 */
export function ValidationCard({
  depense,
  current,
  total,
  totalFile,
  onPrev,
  onNext,
  onAccept,
  onReject,
  onEdit,
  acceptLabel,
  canAct,
  isDGA,
  isPending,
}: ValidationCardProps) {
  const [justificatifOuvert, setJustificatifOuvert] = useState(false);
  // Un justificatif PDF ne s'affiche pas dans une <img> : on bascule sur le lien.
  const [apercuImpossible, setApercuImpossible] = useState(false);

  const titreEtape =
    acceptLabel === 'Viser'
      ? 'Validation DGA'
      : acceptLabel === 'Approuver'
        ? 'Approbation DG'
        : 'Décaissement Comptable';

  const lienJustificatif = depense.justificatif
    ? createUrlFile(depense.justificatif, 'backend')
    : null;

  return (
    <div className="rounded-b-xl border border-t-0 border-separator bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-separator px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-semibold text-foreground">{titreEtape}</h2>
          <p className="text-sm text-muted">
            <span className="tabular-nums">
              Dépense {current + 1} sur {total}
            </span>
            {typeof totalFile === 'number' && totalFile > total && (
              <span className="ml-1 tabular-nums">({totalFile} en attente au total)</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label="Dépense précédente"
            isDisabled={current === 0}
            isIconOnly
            onPress={onPrev}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            aria-label="Dépense suivante"
            isDisabled={current === total - 1}
            isIconOnly
            onPress={onNext}
            size="sm"
            variant="ghost"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm text-muted">{fmtDate(depense.dateDepense)}</span>
          </div>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {formatCFA(depense.montant)}
          </span>
        </div>

        <p className="mb-0.5 font-semibold text-foreground">{depense.libelle}</p>
        <p className="mb-3 text-sm text-muted">{depense.categorie?.nomCategorie}</p>

        <WorkflowStepper statut={depense.statut} />

        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-surface-secondary p-3">
          <div className="min-w-0">
            <p className="text-xs text-muted">Créé par</p>
            <p className="text-sm font-medium text-foreground">Comptable</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted">Date de création</p>
            <p className="text-sm font-medium tabular-nums text-foreground">
              {fmtDate(depense.createdAt ?? depense.dateDepense)}
            </p>
          </div>
          {lienJustificatif && (
            <div className="col-span-2">
              <Button onPress={() => setJustificatifOuvert(true)} size="sm" variant="ghost">
                <FileText aria-hidden="true" />
                Voir le justificatif
              </Button>
            </div>
          )}
        </div>
      </div>

      <FenetreAction
        libelleFermer="Fermer"
        onFermer={() => setJustificatifOuvert(false)}
        ouvert={justificatifOuvert}
        titre={`Justificatif : ${depense.libelle}`}
      >
        {lienJustificatif && (
          <>
            <div className="overflow-hidden rounded-lg border border-separator bg-surface-secondary">
              {apercuImpossible ? (
                <Link
                  className="w-full justify-center py-8 text-sm"
                  href={lienJustificatif}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <Download aria-hidden="true" className="mr-2 size-4" />
                  Ouvrir le fichier
                </Link>
              ) : (
                <img
                  alt="Justificatif"
                  className="max-h-[60vh] w-full object-contain"
                  onError={() => setApercuImpossible(true)}
                  src={lienJustificatif}
                />
              )}
            </div>
            <a
              className="button button--md button--outline button--full-width"
              href={lienJustificatif}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Download aria-hidden="true" />
              Télécharger
            </a>
          </>
        )}
      </FenetreAction>

      {canAct ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-separator px-5 py-4">
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
        <div className="flex items-center justify-center gap-2 rounded-b-xl border-t border-separator py-3 text-sm text-muted">
          <StatusBadge statut={depense.statut} />
        </div>
      )}
    </div>
  );
}
