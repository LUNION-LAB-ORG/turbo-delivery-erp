'use client';

import { Label, ListBox, Select } from '@heroui-v3/react';

import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';

/** Les tailles de page offertes, telles qu'elles l'etaient deja. */
const TAILLES = [5, 10, 20, 50];

interface PaginationProps {
    currentPage: number;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;
    onPageChange: (page: number) => void;
    /** Ce que l'on compte, pour la phrase de position : « 137 commissions ». */
    quoi?: string;
    totalItems: number;
    totalPages: number;
}

/**
 * Le pied de la liste : ou l'on en est, combien de lignes, et la navigation.
 *
 * <h3>Ce qui change</h3>
 * <p>Les numeros de page etaient des `Button` de shadcn construits sur
 * `Array.from({ length: Math.min(5, totalPages) })` : la liste s'arretait a CINQ, suivie
 * de points de suspension qui n'etaient pas cliquables. Passe la cinquieme page, la seule
 * facon d'atteindre la dixieme etait d'appuyer cinq fois sur « suivant », et la derniere
 * page n'etait joignable par aucun geste direct. Les numeros viennent maintenant de
 * `PaginationTableau`, la pagination deja partagee par les tableaux de l'ERP, qui replie
 * le milieu et garde la premiere et la derniere page atteignables.</p>
 *
 * <p>La page courante etait peinte en `variant="default"`, soit le ROUGE DE MARQUE. Le
 * rouge annonce un geste ; la page ou l'on se trouve ne demande rien, elle situe. Le
 * composant partage la marque d'une pastille neutre.</p>
 *
 * <p>La phrase de position se terminait par « depenses » sur un ecran de COMMISSIONS :
 * le pied avait ete recopie du module des depenses. Elle nomme ce qu'elle compte, et son
 * premier nombre valait « 1 » sur une liste vide, ce qui annoncait une ligne inexistante.</p>
 *
 * <p>Le choix du nombre de lignes etait un `<select>` HTML nu, habille de
 * `border rounded px-2 py-1` : le seul controle de l'ecran a ne pas suivre le theme, donc
 * blanc sur blanc en sombre.</p>
 */
export function Pagination({
    currentPage,
    itemsPerPage,
    onItemsPerPageChange,
    onPageChange,
    quoi = 'éléments',
    totalItems,
    totalPages,
}: PaginationProps) {
    const debut = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const fin = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col flex-wrap items-center justify-between gap-4 border-t border-separator p-4 md:flex-row">
            <p className="text-sm text-muted">
                Affichage de <span className="tabular-nums">{debut}</span> à{' '}
                <span className="tabular-nums">{fin}</span> sur{' '}
                <span className="font-medium tabular-nums text-foreground">{totalItems}</span> {quoi}
            </p>

            <div className="flex flex-wrap items-end justify-end gap-4">
                <Select
                    className="w-32"
                    onChange={(v) => onItemsPerPageChange(Number(v))}
                    value={String(itemsPerPage)}
                >
                    <Label>Lignes par page</Label>
                    <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {TAILLES.map((taille) => (
                                <ListBox.Item
                                    id={String(taille)}
                                    key={taille}
                                    textValue={String(taille)}
                                >
                                    {taille}
                                    <ListBox.ItemIndicator />
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <PaginationTableau onPage={onPageChange} page={currentPage} total={totalPages} />
            </div>
        </div>
    );
}
