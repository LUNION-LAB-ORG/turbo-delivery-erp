'use client';

import { Button, Card } from '@heroui-v3/react';
import { ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react';
import React from 'react';

import { LienAvecFiltres } from '@/components/commons/LienAvecFiltres';
import type { IClassement } from '@/features/classement-partenaires/types/classement.types';
import { instant, libellePeriode } from '@/features/classement-partenaires/utils/classement-format.utils';
import { LIBELLE_TRI } from '@/features/classement-partenaires/utils/classement-tri.utils';

/**
 * L'entete du classement.
 *
 * <h3>Ce qu'elle dit avant le tableau</h3>
 * <p>Trois choses, et pas une de plus : sur QUELLE periode, sur QUEL indicateur le rang a
 * ete etabli, et d'ou viennent les chiffres. L'indicateur n'est pas un detail de reglage :
 * un partenaire premier en livraisons peut etre douzieme en commission, et un tableau qui
 * ne dirait pas sur quoi il classe se lirait comme un palmares unique.</p>
 *
 * <p>La provenance importe autant. « Instantane fige » et « recalcule a l'instant » ne
 * portent pas la meme confiance : le second peut changer si une commission est corrigee
 * retroactivement, le premier jamais.</p>
 *
 * <h3>Les exports ne portent pas l'accent</h3>
 * <p>Ils ne changent rien : ils recopient ce qui est deja a l'ecran. Le seul geste de cette
 * page qui ecrive quelque chose est la capture d'instantane, et c'est elle qui prend
 * l'accent, dans le bandeau qui explique pourquoi elle manque.</p>
 */
export function ClassementEntete({
  classement,
  isLoading,
  onExportExcel,
  onExportPdf,
}: {
  classement?: IClassement;
  isLoading: boolean;
  onExportExcel: () => void;
  onExportPdf: () => void;
}) {
  const exportPossible = Boolean(classement && classement.lignes.length > 0);

  return (
    <Card className="mb-4">
      <Card.Content className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <LienAvecFiltres
              chemin="/finance/rapports-performance"
              className="mb-2"
              taille="sm"
              variante="ghost"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Rapport de performance
            </LienAvecFiltres>

            <h1 className="text-2xl font-bold text-foreground">Classification des partenaires</h1>

            <p className="mt-1 text-sm text-muted">
              {isLoading ? (
                <span className="inline-block h-4 w-64 animate-pulse rounded bg-surface-secondary align-middle" />
              ) : classement ? (
                <>
                  <span className="capitalize">{libellePeriode(classement.periode)}</span>
                  {' · classé par '}
                  {LIBELLE_TRI[classement.tri]}
                  {classement.sens === 'ASC' ? ' (croissant)' : ' (décroissant)'}
                  {' · '}
                  {classement.periode.source === 'SNAPSHOT'
                    ? `instantané figé le ${instant(classement.periode.calculeLe)}`
                    : `recalculé le ${instant(classement.periode.calculeLe)}`}
                </>
              ) : (
                'Période indisponible'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button isDisabled={!exportPossible} onPress={onExportExcel} variant="outline">
              <FileSpreadsheet aria-hidden="true" className="size-4" />
              Excel
            </Button>
            <Button isDisabled={!exportPossible} onPress={onExportPdf} variant="outline">
              <FileText aria-hidden="true" className="size-4" />
              PDF
            </Button>
          </div>
        </div>

        {/*
         * Les parametres ECARTES par le serveur, dits a l'ecran. Un lien ancien peut
         * porter un `restaurantId` en meme temps qu'un `groupeId` : le serveur tranche par
         * precedence au lieu de repondre 400, et sans cette ligne l'ecran afficherait un
         * perimetre different de celui que l'URL semble demander.
         */}
        {classement && classement.selection.parametresIgnores.length > 0 && (
          <p className="text-xs text-warning-soft-foreground">
            Paramètres de sélection ignorés :{' '}
            {classement.selection.parametresIgnores.join(', ')}. Le périmètre appliqué est{' '}
            {classement.selection.groupeNom
              ? `le groupe ${classement.selection.groupeNom}`
              : classement.selection.mode === 'GLOBAL'
                ? "l'ensemble des partenaires"
                : `${classement.selection.restaurantIds.length} établissement(s)`}
            .
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
