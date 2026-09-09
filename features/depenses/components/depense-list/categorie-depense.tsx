'use client';

import { Button, Card, Checkbox, Tooltip } from '@heroui-v3/react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, GitMerge, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import { FusionCategoriesDialog } from '@/components/finance/configuration/fusion-categories-dialog';
import { CategorieDetailModal } from '@/features/depenses/components/depense-list/detail/categorie-detail';
import { ModifierCategorieModal } from '@/features/depenses/components/modifier/modifier-categorie-modal';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { useSupprimerCategorieDepenseMutation } from '@/features/depenses/queries/category/categorie-depense-mutation.query';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

import { CreerCategorieModal } from './creer-categorie';

const formatDate = (dateString: string) => {
  if (!dateString) return '-';

  try {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch {
    return dateString;
  }
};

/**
 * La suppression d'une categorie, declenchee depuis sa ligne.
 *
 * <p>Le declencheur venait de `supprimer-categorie-modal.tsx`, qui le peint en pastille
 * `danger-soft`. Sur une liste, cette pastille se repete a chaque ligne : douze pastilles
 * rouges alignees verticalement, et le rouge cesse d'avertir de quoi que ce soit. Le
 * geste reste au meme endroit, atteignable du meme clic, et il ouvre exactement la meme
 * confirmation : c'est LA que le rouge porte, une fois, sur ce qui va reellement
 * disparaitre.</p>
 */
function SupprimerCategorie({ categorie }: { categorie: ICategorieDepense }) {
  const [ouvert, setOuvert] = useState(false);
  const { isPending, mutate } = useSupprimerCategorieDepenseMutation();

  return (
    <>
      <Tooltip>
        {/* Ni le mur ni le gris. En `danger-soft` au repos, cette corbeille se repetait sur
            chaque ligne du referentiel : dix pastilles rouges alignees, et le rouge ne
            previent plus de rien. Passee en neutre, elle devenait l'exacte jumelle des
            boutons qui CONSULTENT et MODIFIENT la ligne. Elle est donc neutre au repos et
            prend la teinte du danger des qu'on la vise, au pointeur comme au clavier :
            l'avertissement arrive au moment ou il sert, pas dix fois d'avance. */}
        <Button
          aria-label={`Supprimer la catégorie ${categorie.nomCategorie}`}
          className="hover:bg-danger-soft hover:text-danger-soft-foreground focus-visible:bg-danger-soft focus-visible:text-danger-soft-foreground"
          isIconOnly
          onPress={() => setOuvert(true)}
          size="sm"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
        <Tooltip.Content>Supprimer</Tooltip.Content>
      </Tooltip>

      <FenetreAction
        destructif
        enAttente={isPending}
        libelleAction={isPending ? 'Suppression…' : 'Supprimer'}
        onAction={() => mutate(categorie.id, { onSuccess: () => setOuvert(false) })}
        onFermer={() => setOuvert(false)}
        ouvert={ouvert}
        titre={`Supprimer ${categorie.nomCategorie} ?`}
      >
        <p className="text-sm text-muted">Cette action est irréversible.</p>

        <div className="rounded-lg border border-danger/25 bg-danger-soft p-3 text-sm text-danger-soft-foreground">
          Toutes les dépenses rattachées à cette catégorie seront supprimées en même temps.
          {typeof categorie.totalDepense === 'number' && (
            <>
              {' '}
              Elles totalisent{' '}
              <span className="font-semibold tabular-nums">{formatCFA(categorie.totalDepense)}</span>
              .
            </>
          )}
        </div>
      </FenetreAction>
    </>
  );
}

/**
 * Le cumul des depenses d'une categorie.
 *
 * <p>Le backend tient `total_depense` comme un COMPTEUR : il ajoute a la creation d'une
 * depense et retranche a la modification, au marquage paye et a la suppression, en bornant
 * chacune de ces trois soustractions par `Math.max(0, ...)`. Un total negatif n'est donc
 * pas une recette ni un signe metier : c'est un compteur qui a derive, et la liste le
 * rendait en noir, exactement comme un total sain. Il est affiche tel qu'il est stocke,
 * parce que rien ici ne permet de le recalculer, mais il est signale.</p>
 */
function MontantCumule({ valeur }: { valeur: number }) {
  if (!(typeof valeur === 'number' && valeur < 0)) return <>{formatCFA(valeur)}</>;

  return (
    <span
      className="inline-flex items-center justify-end gap-1.5 text-warning-soft-foreground"
      title="Total négatif : le cumul de cette catégorie a dérivé côté serveur. La valeur est affichée telle qu'elle est stockée."
    >
      <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
      {formatCFA(valeur)}
    </span>
  );
}

/**
 * Le referentiel des categories de depense.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Le nom. C'est par lui qu'il reconnait un doublon, et c'est le doublon qui l'amene
 * ici. Il etait enferme dans une pastille grise, qui le donne a lire comme un jeton
 * technique et non comme un libelle saisi par quelqu'un : c'est du texte, il est ecrit
 * comme du texte, et la description qui le distingue d'un homonyme est dessous, au lieu
 * de n'exister que dans la fiche de detail.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Ajouter une categorie, et fusionner des doublons. Les cases a cocher alimentent la
 * fusion, mais la barre qui porte ce geste etait rangee dans l'en-tete de la carte, loin
 * des cases, et ne disait pas qu'il en fallait DEUX : cocher une ligne donnait un bouton
 * inerte sans explication. La barre est contre le tableau, elle dit ce qui manque, et
 * l'accent n'arrive dessus qu'au moment ou le geste devient possible.</p>
 *
 * <h3>La forme naturelle</h3>
 * <p>Un tableau : les montants d'une categorie a l'autre se comparent en colonne, chasse
 * tabulaire, alignes a droite. Le composant de la maison rend des cartes sur telephone et
 * sait dire un echec de lecture autrement que par une liste vide.</p>
 */
export function CategorieDepenseList() {
  const { categories, isError, isFetching, isLoading, refetch } = useCategorieDepense();

  const [sel, setSel] = useState<Set<string>>(new Set());
  const [fusionOpen, setFusionOpen] = useState(false);
  const basculer = (id: string, coche: boolean) =>
    setSel((precedent) => {
      const suivant = new Set(precedent);
      if (coche) suivant.add(id);
      else suivant.delete(id);
      return suivant;
    });

  // Une categorie supprimee ou fusionnee laissait son identifiant dans la selection : la
  // fusion suivante serait partie avec un identifiant qui n'existe plus.
  useEffect(() => {
    setSel((precedent) => {
      if (precedent.size === 0) return precedent;
      const vivants = new Set(categories.map((c) => c.id));
      const suivant = new Set(Array.from(precedent).filter((id) => vivants.has(id)));
      return suivant.size === precedent.size ? precedent : suivant;
    });
  }, [categories]);

  const colonnes: readonly ColonneResponsive<ICategorieDepense>[] = [
    {
      cle: 'nom',
      identite: true,
      libelle: 'Catégorie',
      rendu: (c) => (
        <div className="flex min-w-0 items-start gap-2">
          {/*
           * `slot={null}` : dans un `Table` v3, toute case est branchee d'office sur le
           * contexte de selection de la table, qui exige `slot="selection"` et fait
           * tomber la page en 500 sans lui. Ici la selection est celle de l'ecran, lue
           * par la fusion de doublons : on sort donc du contexte.
           */}
          <Checkbox
            aria-label={`Sélectionner ${c.nomCategorie} pour une fusion`}
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
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{c.nomCategorie}</span>
            {c.description && <span className="truncate text-xs text-muted">{c.description}</span>}
          </span>
        </div>
      ),
    },
    {
      cle: 'date',
      libelle: 'Créée le',
      rendu: (c) => <span className="tabular-nums">{formatDate(c.createdAt)}</span>,
    },
    {
      cle: 'total',
      libelle: 'Total des dépenses',
      nombre: true,
      rendu: (c) => <MontantCumule valeur={c.totalDepense} />,
    },
    {
      actions: true,
      cle: 'actions',
      libelle: 'Actions',
      rendu: (c) => (
        <div className="flex flex-wrap items-center justify-end gap-1">
          <CategorieDetailModal categorie={c} />
          <ModifierCategorieModal categorieDepense={c} />
          <SupprimerCategorie categorie={c} />
        </div>
      ),
    },
  ];

  const assezPourFusionner = sel.size >= 2;

  return (
    <div className="w-full">
      <Card>
        <Card.Header className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <Card.Title>Catégories de dépenses</Card.Title>
            {!isLoading && !isError && (
              <span className="text-sm tabular-nums text-muted">{categories.length}</span>
            )}
          </div>
          <CreerCategorieModal />
        </Card.Header>

        {sel.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-separator pt-2">
            <span className="text-sm text-foreground">
              <span className="font-semibold tabular-nums">{sel.size}</span> sélectionnée
              {sel.size > 1 ? 's' : ''}
              {!assezPourFusionner && (
                <span className="text-muted">
                  {' '}
                  · cochez-en une seconde pour fusionner deux doublons
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                isDisabled={!assezPourFusionner}
                onPress={() => setFusionOpen(true)}
                size="sm"
                variant={assezPourFusionner ? 'primary' : 'secondary'}
              >
                <GitMerge aria-hidden="true" className="size-4" />
                Fusionner
              </Button>
              <Button onPress={() => setSel(new Set())} size="sm" variant="ghost">
                Effacer
              </Button>
            </div>
          </div>
        )}

        <Card.Content>
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
