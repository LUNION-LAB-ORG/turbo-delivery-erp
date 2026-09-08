'use client';

import { Button, Card, Checkbox, Chip } from '@heroui-v3/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { GitMerge } from 'lucide-react';
import { useState } from 'react';

import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import { FusionCategoriesDialog } from '@/components/finance/configuration/fusion-categories-dialog';
import { CategorieDetailModal } from '@/features/depenses/components/depense-list/detail/categorie-detail';
import { ModifierCategorieModal } from '@/features/depenses/components/modifier/modifier-categorie-modal';
import SupprimerCategorieModal from '@/features/depenses/components/supprimer/supprimer-categorie-modal';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

import { CreerCategorieModal } from './creer-categorie';

/*
 * Le nom d'une categorie etait peint parmi SIX couleurs de la palette Tailwind brute,
 * choisies par la somme des codes de ses lettres : rouge, vert, bleu, jaune, rose,
 * violet, toutes avec `text-white`, y compris le jaune, ou le contraste tombe sous
 * 2:1 et le libelle devient illisible. Un rouge et un vert y apparaissaient au hasard
 * sur des lignes ou rien ne va bien ni mal.
 *
 * Une categorie de depense est une CATEGORIE : elle se lit, elle ne se signale pas.
 */

const formatDate = (dateString: string) => {
  if (!dateString) return '-';

  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateString;
  }
};

/**
 * Les categories de depense.
 *
 * <h3>Ce qui change</h3>
 * <p>L'ecran portait DEUX rendus de la meme liste, ecrits a la main l'un sous l'autre : un
 * tableau pour le poste, une pile de cartes pour le telephone, chacun avec sa copie des
 * cellules. Les deux divergeaient : le tableau se vidait sans un mot quand les cartes,
 * elles, disaient « Aucune categorie ». Les colonnes sont declarees UNE fois ; le tableau
 * de la maison decide de la forme selon la largeur, et sait dire un echec de lecture
 * autrement que par une liste vide.</p>
 *
 * <p>Le montant total etait pose a gauche, en chasse proportionnelle : deux totaux ne se
 * comparaient pas d'un seul regard. Il est aligne a droite, en chasse tabulaire.</p>
 */
export function CategorieDepenseList() {
  const { categories, isError, isFetching, isLoading, refetch } = useCategorieDepense();

  // Selection multiple → fusion de categories en doublon (≥ 2).
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [fusionOpen, setFusionOpen] = useState(false);
  const basculer = (id: string, coche: boolean) =>
    setSel((precedent) => {
      const suivant = new Set(precedent);
      if (coche) suivant.add(id);
      else suivant.delete(id);
      return suivant;
    });

  const colonnes: readonly ColonneResponsive<ICategorieDepense>[] = [
    {
      cle: 'nom',
      identite: true,
      libelle: 'Nom',
      rendu: (c) => (
        <div className="flex min-w-0 items-center gap-2">
          {/*
           * `slot={null}` : dans un `Table` v3, toute case est branchee d'office sur le
           * contexte de selection de la table, qui exige `slot="selection"` et fait
           * tomber la page en 500 sans lui. Ici la selection est celle de l'ecran, lue
           * par la fusion de doublons : on sort donc du contexte.
           */}
          <Checkbox
            aria-label={`Sélectionner ${c.nomCategorie}`}
            isSelected={sel.has(c.id)}
            onChange={(coche) => basculer(c.id, coche)}
            slot={null}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>
          <Chip size="sm" variant="soft">
            <Chip.Label>{c.nomCategorie}</Chip.Label>
          </Chip>
        </div>
      ),
    },
    {
      cle: 'date',
      libelle: 'Date',
      rendu: (c) => formatDate(c.createdAt),
    },
    {
      cle: 'total',
      libelle: 'Montant total',
      nombre: true,
      rendu: (c) => formatCFA(c.totalDepense),
    },
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (c) => (
        <div className="flex flex-wrap items-center gap-3">
          <CategorieDetailModal categorie={c} />
          <ModifierCategorieModal categorieDepense={c} />
          <SupprimerCategorieModal categorieDepense={c} />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Card>
        <Card.Header className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Card.Title>Liste des catégories de dépenses</Card.Title>
          <div className="flex flex-wrap items-center gap-2">
            {sel.size > 0 && (
              <>
                <span className="text-sm text-muted">
                  {sel.size} sélectionnée{sel.size > 1 ? 's' : ''}
                </span>
                <Button
                  isDisabled={sel.size < 2}
                  onPress={() => setFusionOpen(true)}
                  size="sm"
                  variant="primary"
                >
                  <GitMerge aria-hidden="true" className="size-4" />
                  Fusionner{sel.size >= 2 ? ` (${sel.size})` : ''}
                </Button>
                <Button onPress={() => setSel(new Set())} size="sm" variant="ghost">
                  Effacer
                </Button>
              </>
            )}
            <CreerCategorieModal />
          </div>
        </Card.Header>

        <Card.Content className="p-4 md:p-0">
          <TableauResponsive
            cleLigne={(c) => c.id}
            colonnes={colonnes}
            enChargement={isLoading}
            enCoursDeRelance={isFetching}
            erreur={isError}
            libelle="Catégories de dépenses"
            lignes={categories}
            onReessayer={() => refetch()}
            quoi="les catégories de dépenses"
            vide="Aucune catégorie"
          />
        </Card.Content>
      </Card>

      <FusionCategoriesDialog
        ids={Array.from(sel)}
        isOpen={fusionOpen}
        onDone={() => setSel(new Set())}
        onOpenChange={setFusionOpen}
      />
    </div>
  );
}
