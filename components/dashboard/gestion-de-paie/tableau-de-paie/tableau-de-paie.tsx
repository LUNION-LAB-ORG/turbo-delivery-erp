"use client";

import { Avatar, Card, Table } from '@heroui-v3/react';
import { MoveUpRight } from 'lucide-react';
import { useTableauDePaiController } from "./controller";
import { DetailFichePaieModal } from "../detail-fiche-de-paie/detail-fiche-paie-modal";
import { InfoParJour, PaieErpVM, PaieParLivreur } from "@/types/gestion-de-paie.model";


interface TableauDePaieProps {
    datas: PaieErpVM | null;
    periode?: string,
    searchKey?: string;
}

export function TableauDePaie({ datas, periode, searchKey }: TableauDePaieProps) {
    const ctrl = useTableauDePaiController(datas, searchKey);

    return (
        <div className="mt-4 bg-surface rounded-lg">
            <Table className="hidden md:block">
                <Table.ScrollContainer>
                    {/*
                     * `onRowAction` et non un `onClick` sur la rangee : la v3 rend un
                     * `<table role="grid">` de react-aria, ou le clavier passe par la
                     * collection. Le detail d'une fiche de paie ne s'ouvrait qu'a la souris.
                     */}
                    <Table.Content
                        aria-label="Tableau de paie"
                        onRowAction={(cle) => {
                            const ligne = ctrl.data?.[Number(cle)];
                            if (ligne) ctrl.openDetailModal(ligne);
                        }}
                    >
                        <Table.Header>
                            <Table.Column id="nom" isRowHeader>
                                Nom et prénoms
                            </Table.Column>
                            {/* Cinq colonnes de montants : elles s'alignent a droite en
                                chasse tabulaire, sinon deux paies ne se comparent qu'en
                                comptant les chiffres. */}
                            <Table.Column className="text-right" id="total">
                                Total réalisé
                            </Table.Column>
                            <Table.Column className="text-right" id="gain">
                                Gain initial
                            </Table.Column>
                            <Table.Column id="jours">Jours de travail</Table.Column>
                            <Table.Column id="weekend">Week-end</Table.Column>
                            <Table.Column className="text-right" id="taux">
                                Taux d’intérêt
                            </Table.Column>
                            <Table.Column className="text-right" id="commission">
                                Commission
                            </Table.Column>
                            <Table.Column className="text-right" id="prime">
                                Prime
                            </Table.Column>
                            <Table.Column id="etat">État</Table.Column>
                        </Table.Header>
                        <Table.Body
                            renderEmptyState={() => (
                                <p className="py-8 text-center text-sm text-muted">
                                    Aucune paie trouvée
                                </p>
                            )}
                        >
                            {(ctrl.data ?? []).map((item: PaieParLivreur, index) => (
                                <Table.Row id={String(index)} key={index}>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            {/* C'etait un rond gris vide, `w-7 h-7 rounded-full
                                                bg-surface-tertiary`, tenant lieu d'avatar sur
                                                toutes les lignes. */}
                                            <Avatar className="size-8 shrink-0">
                                                <Avatar.Fallback>
                                                    {item.nomComplet?.[0]?.toUpperCase() ?? '?'}
                                                </Avatar.Fallback>
                                            </Avatar>
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-sm font-medium text-foreground">
                                                    {item.nomComplet}
                                                </span>
                                                {ctrl.getStatusChip(item.type)}
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell className="text-right tabular-nums">
                                        {item.total} FCFA
                                    </Table.Cell>
                                    <Table.Cell className="text-right tabular-nums">
                                        {item.gain} FCFA
                                    </Table.Cell>
                                    <Table.Cell>
                                        {item.joursTravaille?.map((jour: InfoParJour, i: number) => (
                                            <span key={i}>{ctrl.recupererStatutJours(jour)}</span>
                                        ))}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {item.weekEnd?.map((w: InfoParJour, i: number) => (
                                            <span key={i}>{ctrl.recupererStatutJoursWeekend(w)}</span>
                                        ))}
                                    </Table.Cell>
                                    <Table.Cell className="text-right tabular-nums">
                                        {item.taux}
                                    </Table.Cell>
                                    <Table.Cell className="text-right tabular-nums">
                                        {item.commission} FCFA
                                    </Table.Cell>
                                    <Table.Cell className="text-right">
                                        {(() => {
                                    /*
                                     * La prime etait rendue par un ternaire `prime > 0 ?
                                     * vert : rouge`, et le libelle commencait par « + »
                                     * dans les DEUX branches. Une prime nulle ou absente
                                     * s'affichait donc « + 0 FCFA » en ROUGE avec une
                                     * fleche vers le BAS, comme une perte. Une prime ne
                                     * peut pas etre negative : elle est la, ou elle n'est
                                     * pas.
                                     */
                                    const prime = item?.prime ?? 0;
                                    if (prime > 0) {
                                        return (
                                            <span className="flex items-center justify-end gap-1 text-sm tabular-nums text-success-soft-foreground">
                                                <MoveUpRight aria-hidden="true" size={16} />+{' '}
                                                {prime} FCFA
                                            </span>
                                        );
                                    }
                                    return <span className="text-sm text-muted">Aucune prime</span>;
                                })()}
                                    </Table.Cell>
                                    <Table.Cell>{ctrl.conditionValidation(item)}</Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>

            {/* Mobile — une carte par livreur (remplace le tableau < md) */}
            <div className="space-y-3 md:hidden">
                {(!ctrl.data || ctrl.data.length === 0) ? (
                    <p className="py-10 text-center text-sm text-muted">Aucune paie trouvée</p>
                ) : (
                    ctrl.data.map((item: PaieParLivreur, index) => (
                        <Card
                            className="cursor-pointer active:bg-surface-secondary"
                            key={index}
                            onClick={() => ctrl.openDetailModal(item)}
                        >
                          <Card.Content className="gap-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <Avatar className="size-8 shrink-0">
                                        <Avatar.Fallback>
                                            {item.nomComplet?.[0]?.toUpperCase() ?? '?'}
                                        </Avatar.Fallback>
                                    </Avatar>
                                    <p className="truncate text-sm font-semibold text-foreground">{item.nomComplet}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                    {ctrl.getStatusChip(item.type)}
                                    {ctrl.conditionValidation(item)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-muted">Total réalisé</span>
                                <span className="text-sm text-foreground">{item.total}&nbsp; FCFA</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-muted">Gain initial</span>
                                <span className="text-sm text-foreground">{item.gain}&nbsp; FCFA</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-muted">Commission</span>
                                <span className="text-sm text-foreground">{item.commission}&nbsp; FCFA</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-muted">Taux d’intérêt</span>
                                <span className="text-sm text-foreground">{item.taux}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 text-xs text-muted">Prime</span>
{(item?.prime ?? 0) > 0 ? (
                                    <span className="flex items-center gap-1 text-sm tabular-nums text-success-soft-foreground">
                                        <MoveUpRight aria-hidden="true" size={16} />+ {item.prime} FCFA
                                    </span>
                                ) : (
                                    <span className="text-sm text-muted">Aucune prime</span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <span className="shrink-0 text-xs text-muted">Jours de travail</span>
                                <span className="text-right">
                                    {item.joursTravaille && item.joursTravaille?.map((jour: InfoParJour, i: number) => (
                                        <span key={i}>{ctrl.recupererStatutJours(jour)}</span>
                                    ))}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <span className="shrink-0 text-xs text-muted">Week-end</span>
                                <span className="text-right">
                                    {item.weekEnd && item.weekEnd?.map((weeek: InfoParJour, i: number) => (
                                        <span key={i}>{ctrl.recupererStatutJoursWeekend(weeek)}</span>
                                    ))}
                                </span>
                            </div>
                          </Card.Content>
                        </Card>
                    ))
                )}
            </div>

            {/*
             * Une pagination etait posee ici, `fixed bottom-4`, par-dessus le contenu et
             * avec un rectangle floute derriere : `total={1} page={1} onChange={() => ""}`.
             * Une page sur une, un gestionnaire qui rend la chaine vide — un ornement, qui
             * recouvrait les dernieres lignes du tableau sur la fenetre des postes.
             */}
            <DetailFichePaieModal onClose={ctrl.onClose} isOpen={ctrl.isOpen} details={ctrl.details} periode={periode} nonEligible={ctrl.nonEligible} />
        </div>
    );
};
