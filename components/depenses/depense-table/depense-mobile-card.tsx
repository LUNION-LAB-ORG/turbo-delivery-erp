'use client';

import { Card } from '@heroui-v3/react';

import {
  DepenseActions,
  EtiquetteTypeDepense,
  formatDateDepense,
} from '@/components/depenses/depense-table/depense-columns';
import { IDepense } from '@/features/depenses/types/depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

/**
 * Une depense au doigt (cf. `depense-table/index.tsx`, qui bascule a `md`).
 *
 * <p>La carte etait un `div` habille a la main (fond, bordure, arrondi, ombre) a cote
 * d'un tableau qui, lui, vient de la bibliotheque : deux surfaces qui ne se ressemblaient
 * pas sur le meme ecran. C'est la `Card` de la bibliotheque, comme les cartes de la liste
 * des categories juste a cote.</p>
 *
 * <p>Les deux dates affichaient la MEME valeur sous deux libelles differents. Elles
 * viennent maintenant chacune de leur champ, comme dans l'export CSV.</p>
 */
export function DepenseMobileCard({ depense }: { depense: IDepense }) {
  return (
    <Card>
      <Card.Content className="gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-sm font-semibold wrap-break-word text-foreground">
            {depense.description || depense.categorie?.nomCategorie || 'Dépense'}
          </p>
          <span className="shrink-0">
            <EtiquetteTypeDepense typeDepense={depense.typeDepense} />
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 text-xs text-muted">Catégorie</span>
          <span className="min-w-0 text-right text-sm wrap-break-word text-foreground">
            {depense.categorie?.nomCategorie ?? '-'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 text-xs text-muted">Date d&apos;ajout</span>
          <span className="text-sm tabular-nums text-foreground">
            {formatDateDepense(depense.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 text-xs text-muted">Comptabilisation</span>
          <span className="text-sm tabular-nums text-foreground">
            {formatDateDepense(depense.dateDepense)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="shrink-0 text-xs text-muted">Montant</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatCFA(depense.montant)}
          </span>
        </div>

        <div className="flex justify-end pt-1">
          <DepenseActions depense={depense} />
        </div>
      </Card.Content>
    </Card>
  );
}
