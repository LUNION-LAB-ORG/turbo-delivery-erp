'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreerCategorieModal } from './creer-categorie';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Button as HButton, Checkbox, Chip } from '@heroui-v3/react';
import { GitMerge, MoreHorizontal } from 'lucide-react';
import { CategorieDetailModal } from '@/features/depenses/components/depense-list/detail/categorie-detail';
import { ModifierCategorieModal } from '@/features/depenses/components/modifier/modifier-categorie-modal';
import SupprimerCategorieModal from '@/features/depenses/components/supprimer/supprimer-categorie-modal';
import { useCategorieDepense } from '@/features/depenses/hooks/use-categorie-depense';
import { FusionCategoriesDialog } from '@/components/finance/configuration/fusion-categories-dialog';
import EtatErreur from '@/components/commons/EtatErreur';

export function CategorieDepenseList() {
  const { categories: categorie_depenses, isFetching, isError, refetch } = useCategorieDepense();

  // Sélection multiple → fusion de catégories en doublon (≥ 2).
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [fusionOpen, setFusionOpen] = useState(false);
  const toggle = (id: string, v: boolean) =>
    setSel((p) => { const n = new Set(p); v ? n.add(id) : n.delete(id); return n; });
  const selectedIds = Array.from(sel);

  /*
   * Le nom d'une categorie etait peint parmi SIX couleurs de la palette Tailwind brute,
   * choisies par la somme des codes de ses lettres : rouge, vert, bleu, jaune, rose,
   * violet — toutes avec `text-white`, y compris le jaune, ou le contraste tombe sous
   * 2:1 et le libelle devient illisible. Un rouge et un vert y apparaissaient au hasard
   * sur des lignes ou rien ne va bien ni mal.
   *
   * Une categorie de depense est une CATEGORIE : elle se lit, elle ne se signale pas.
   */

  // fonction pour formater la createdAt
  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    try {
      const date = parseISO(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (error) {
      console.warn('Erreur de formatage de date:', error);
      return dateString;
    }
  };

  return (
    <div className="w-full px-4 py-6">
      <Card className="">
        <CardHeader className="">
          <CardTitle>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-lg font-normal">Liste des catégories de dépenses</span>
              <div className="flex items-center gap-2">
                {sel.size > 0 && (
                  <>
                    <span className="text-sm text-muted">{sel.size} sélectionnée{sel.size > 1 ? 's' : ''}</span>
                    <HButton
                      isDisabled={sel.size < 2}
                      onPress={() => setFusionOpen(true)}
                      size="sm"
                      variant="primary"
                    >
                      <GitMerge aria-hidden="true" className="size-4" />
                      Fusionner{sel.size >= 2 ? ` (${sel.size})` : ''}
                    </HButton>
                    <HButton onPress={() => setSel(new Set())} size="sm" variant="ghost">
                      Effacer
                    </HButton>
                  </>
                )}
                <CreerCategorieModal />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Double rendu : le tableau desktop se vidait sans un mot et les cartes
              mobiles disaient « Aucune categorie ». Les deux sont remplaces ensemble. */}
          {isError ? (
            <EtatErreur quoi="les catégories de dépenses" onReessayer={() => refetch()} enCours={isFetching} />
          ) : (
          <>
          {/* Tableau — desktop uniquement (≥ md) */}
          <Table className="hidden md:table">
            <TableHeader className="">
              {/* L'en-tete du tableau etait un aplat ROUGE PLEIN, survol compris. */}
              <TableRow className="bg-surface-secondary">
                <TableHead className="w-10"></TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Nom </TableHead>
                <TableHead className="font-semibold">Montant total</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorie_depenses.map((categorie_depense) => (
                <TableRow key={categorie_depense.id} className="transition-colors">
                  <TableCell className="border-b-2">
                    <Checkbox
                      aria-label={`Sélectionner ${categorie_depense.nomCategorie}`}
                      isSelected={sel.has(categorie_depense.id)}
                      onChange={(v) => toggle(categorie_depense.id, v)}
                    >
                      <Checkbox.Content>
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Content>
                    </Checkbox>
                  </TableCell>
                  <TableCell className="font-medium border-b-2">{formatDate(categorie_depense.createdAt)}</TableCell>
                  <TableCell className="border-b-2">
                    <Chip size="sm" variant="soft">
                      <Chip.Label>{categorie_depense.nomCategorie}</Chip.Label>
                    </Chip>
                  </TableCell>
                  <TableCell className="border-b-2">{Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(categorie_depense.totalDepense)}</TableCell>
                  <TableCell className="border-b-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary">
                          <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <CategorieDetailModal categorie={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <ModifierCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <SupprimerCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Mobile — cartes tactiles (remplace le tableau < md) */}
          <div className="md:hidden space-y-3 p-4">
            {categorie_depenses.length === 0 ? (
              <p className="text-sm text-muted text-center py-10">Aucune catégorie</p>
            ) : (
              categorie_depenses.map((categorie_depense) => (
                <div key={categorie_depense.id} className="bg-surface dark:bg-transparent border border-separator rounded-xl p-4 shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Checkbox
                        aria-label={`Sélectionner ${categorie_depense.nomCategorie}`}
                        isSelected={sel.has(categorie_depense.id)}
                        onChange={(v) => toggle(categorie_depense.id, v)}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                      <Chip size="sm" variant="soft">
                        <Chip.Label>{categorie_depense.nomCategorie}</Chip.Label>
                      </Chip>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4 cursor-pointer" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <CategorieDetailModal categorie={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <ModifierCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <SupprimerCategorieModal categorieDepense={categorie_depense} />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">Date</span>
                    <span className="text-sm text-foreground">{formatDate(categorie_depense.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted">Montant total</span>
                    <span className="text-sm font-semibold text-foreground">{Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(categorie_depense.totalDepense)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          </>
          )}
        </CardContent>
      </Card>

      <FusionCategoriesDialog
        ids={selectedIds}
        isOpen={fusionOpen}
        onOpenChange={setFusionOpen}
        onDone={() => setSel(new Set())}
      />
    </div>
  );
}

