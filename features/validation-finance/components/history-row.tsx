'use client';

import { Button, Link } from '@heroui-v3/react';
import { Download, Eye } from 'lucide-react';
import { useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { createUrlFile } from '@/utils/createUrlFile';

import { StatusBadge, TypeBadge } from './validation-badges';
import { fmtDate } from './validation.constants';

/**
 * Une depense deja tranchee, dans l'historique des validations.
 *
 * <h3>Ce qui change</h3>
 * <p>Le montant etait pose au milieu du texte, en chasse proportionnelle et peint en
 * bleu. D'une ligne a l'autre les montants ne tombaient pas sur la meme colonne, donc ne
 * se comparaient pas, et leur couleur ne voulait rien dire. Ils sont a droite, en chasse
 * tabulaire, dans la couleur du texte.</p>
 *
 * <p>Le lien vers le justificatif etait un `<button>` qui appelait `window.open` : le
 * bloqueur de fenetres du navigateur l'avalait, on ne pouvait ni le survoler pour voir sa
 * destination ni l'ouvrir dans un onglet choisi. C'est un vrai lien.</p>
 */
export function HistoryRow({ depense }: { depense: IDepense }) {
  const [ouvert, setOuvert] = useState(false);
  // Un justificatif PDF ne s'affiche pas dans une <img> : la bascule etait faite en
  // touchant le DOM a la main (`nextElementSibling.classList`), a cote de React.
  const [apercuImpossible, setApercuImpossible] = useState(false);

  const lienJustificatif = depense.justificatif
    ? createUrlFile(depense.justificatif, 'backend')
    : null;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 transition-colors hover:bg-surface-secondary">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <TypeBadge type={depense.typeDepense} />
            <span className="text-sm text-muted">{fmtDate(depense.dateDepense)}</span>
            <StatusBadge statut={depense.statut} />
          </div>
          <h3 className="font-semibold text-foreground">{depense.libelle}</h3>
          <p className="text-sm text-muted">{depense.categorie?.nomCategorie}</p>
        </div>

        <div className="flex items-center gap-4">
          <p className="min-w-32 text-right text-lg font-bold tabular-nums text-foreground">
            {formatCFA(depense.montant)}
          </p>
          <div className="flex items-center gap-2">
            {lienJustificatif && (
              <a
                className="button button--sm button--ghost"
                href={lienJustificatif}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Download aria-hidden="true" />
                <span className="hidden sm:inline">Justificatif</span>
              </a>
            )}
            <Button onPress={() => setOuvert(true)} size="sm" variant="outline">
              <Eye aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Détails</span>
            </Button>
          </div>
        </div>
      </div>

      <FenetreAction
        libelleFermer="Fermer"
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre="Détails de la dépense"
      >
        <div className="flex items-center justify-between gap-3">
          <TypeBadge type={depense.typeDepense} />
          <StatusBadge statut={depense.statut} />
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-surface-secondary p-4 text-sm">
          <div className="min-w-0">
            <dt className="text-xs text-muted">Libellé</dt>
            <dd className="font-medium text-foreground">{depense.libelle}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted">Montant</dt>
            <dd className="font-bold tabular-nums text-foreground">{formatCFA(depense.montant)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted">Date</dt>
            <dd className="font-medium tabular-nums text-foreground">{fmtDate(depense.dateDepense)}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted">Catégorie</dt>
            <dd className="font-medium text-foreground">{depense.categorie?.nomCategorie ?? 'Non renseignée'}</dd>
          </div>
          {depense.sourcePaiement && (
            <div className="col-span-2 min-w-0">
              <dt className="text-xs text-muted">Source de paiement</dt>
              <dd className="font-medium text-foreground">{depense.sourcePaiement}</dd>
            </div>
          )}
          {depense.description && (
            <div className="col-span-2 min-w-0">
              <dt className="text-xs text-muted">Description</dt>
              <dd className="font-medium text-foreground">{depense.description}</dd>
            </div>
          )}
        </dl>

        {lienJustificatif && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted">Justificatif</p>
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
                  className="max-h-64 w-full object-contain"
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
          </div>
        )}
      </FenetreAction>
    </>
  );
}
