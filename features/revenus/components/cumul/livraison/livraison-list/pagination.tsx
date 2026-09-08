'use client';

import { ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
}

const TAILLES_DE_PAGE = [5, 10, 20, 50] as const;

/**
 * La barre de pagination de la liste des livraisons.
 *
 * <h3>Ce qui change</h3>
 * <p>Elle annoncait « sur N depenses » sur un ecran de LIVRAISONS : la phrase avait ete
 * recopiee depuis le module des depenses, comme dans le module des commissions ou elle
 * subsiste encore.</p>
 *
 * <p>Elle n'offrait par ailleurs que les CINQ PREMIERES pages, quel qu'en soit le
 * nombre : au-dela, seul « suivant » permettait d'avancer, une page a la fois, et la
 * derniere etait hors d'atteinte en un geste. `PaginationTableau`, deja monte partout
 * ailleurs dans l'ERP, garde toujours la premiere et la derniere et replie le milieu.</p>
 *
 * <p>Le nombre de lignes par page passait par un `Select` de shadcn, dont le texte de
 * substitution invitait a « Sélectionnez une catégorie ». Quatre valeurs courtes se
 * choisissent d'un clic, sans liste deroulante a ouvrir.</p>
 */
export function Pagination({
  currentPage,
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange,
  totalItems,
  totalPages,
}: PaginationProps) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  // Sur une liste vide, la barre affirmait « Affichage de 1 à 0 sur 0 ».
  const premier = totalItems === 0 ? 0 : startIndex + 1;
  const dernier = Math.min(startIndex + itemsPerPage, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-separator bg-surface-secondary p-4 md:flex-row">
      <p className="text-sm tabular-nums text-muted">
        Affichage de {premier} à {dernier} sur {totalItems} livraison
        {totalItems > 1 ? 's' : ''}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted" id="lignes-par-page">
            Lignes par page
          </span>
          <ToggleButtonGroup
            aria-labelledby="lignes-par-page"
            disallowEmptySelection
            onSelectionChange={(cles) => {
              const choisie = Array.from(cles)[0];
              if (choisie != null) onItemsPerPageChange(Number(choisie));
            }}
            selectedKeys={new Set([String(itemsPerPage)])}
            selectionMode="single"
            size="sm"
          >
            {TAILLES_DE_PAGE.map((taille) => (
              <ToggleButton id={String(taille)} key={taille}>
                {taille}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>

        <PaginationTableau onPage={onPageChange} page={currentPage} total={totalPages} />
      </div>
    </div>
  );
}
