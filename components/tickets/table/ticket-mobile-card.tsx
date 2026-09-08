'use client';

import {
    Button,
    Checkbox,
    Spinner,
    Calendar,
    Card,
    ComboBox,
    DateField,
    DatePicker,
    Input,
    Label,
    ListBox,
    NumberField,
    TextField,
    TimeField,
    Tooltip,
} from '@heroui-v3/react';
import { CalendarDate, Time, type DateValue } from '@internationalized/date';
import { Check, ChevronLeft, ChevronRight, Pen, ShieldCheck, Trash2, X } from 'lucide-react';
import React from 'react';

import { SelecteurZone } from '@/features/tickets/components/selecteur-zone';
import { commissionAffichee } from '@/features/tickets/utils/commission.utils';
import { cn } from '@/lib/utils';
import { formatCFA, formatDateFR, formatHoursMinutes } from '@/src/actions/bonLivraison.mapper';
import { Ticket } from '@/types/bon-livraison.model';
import { StatutControle } from '@/types/statut-controle.enum';

import { StatutTicket } from './statut-ticket';
import type { TicketColumnMeta } from './ticket-table-columns';

/**
 * La carte d'un ticket au telephone, en remplacement du tableau dense sous `md`.
 *
 * <p>Elle est pilotee par le MEME `TicketColumnMeta` que les colonnes du tableau : memes
 * gestionnaires, memes etats, meme logique de droits. Aucune divergence possible entre les
 * deux surfaces — c'etait deja le cas et cela le reste.</p>
 *
 * <h3>Ce qui change</h3>
 * <ul>
 *   <li>Les champs de saisie etaient des `<input>` bruts et deux `react-select`. Ils
 *       passent aux composants de la bibliotheque, donc au theme et au clavier mobile
 *       adapte (segments de date et d'heure, pave numerique pour les montants).</li>
 *   <li>Aucune couleur n'etait declinee en sombre — `bg-surface`, `text-muted`,
 *       `bg-green-500` — et depuis que la bascule est dans l'en-tete, la carte s'affichait
 *       blanche sur une interface sombre.</li>
 *   <li>Les six actions etaient des `<button>` colores a la main, sans libelle accessible.
 *       Ce sont des boutons de la bibliotheque, l'attente passant par `isPending`.</li>
 * </ul>
 */

const MODIFIABLE_STATUTS = new Set<string>([
    StatutControle.PENDING,
    StatutControle.TARDIF,
    StatutControle.REJETE_FRAUDE,
]);

/** « 2026-09-04 » vers une date calendaire, sans heure ni fuseau. */
const enCalendaire = (iso: string): CalendarDate | null => {
    const [a, m, j] = (iso ?? '').split('-').map(Number);
    return a && m && j ? new CalendarDate(a, m, j) : null;
};

/** « 19h22 », « 19:22 », « 19:22:04 » ou « 1922 » vers une heure typee. */
const enHeure = (v: string): Time | null => {
    const m = (v ?? '').match(/^(\d{1,2})\s*[h:]?\s*(\d{2})/);
    if (!m) return null;
    const [h, min] = [Number(m[1]), Number(m[2])];
    return h < 24 && min < 60 ? new Time(h, min) : null;
};

/** Une valeur en lecture : libelle a gauche, valeur a droite, alignees d'une ligne a l'autre. */
function Champ({
    chiffre,
    libelle,
    children,
}: {
    /** Un montant : chasse tabulaire, pour qu'il se compare d'une carte a l'autre. */
    chiffre?: boolean;
    libelle: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="shrink-0 text-xs text-muted">{libelle}</span>
            <span
                className={cn(
                    'truncate text-right text-sm text-foreground',
                    chiffre && 'tabular-nums',
                )}
            >
                {children}
            </span>
        </div>
    );
}

/** Une liste FILTRABLE : indispensable au doigt, avec 222 livreurs. */
function Liste({
    libelle,
    options,
    valeur,
    onChoix,
}: {
    libelle: string;
    options: { value: string; label: string }[];
    valeur: string;
    onChoix: (v: string) => void;
}) {
    return (
        <ComboBox onSelectionChange={(c) => onChoix(String(c ?? ''))} selectedKey={valeur || null}>
            <Label>{libelle}</Label>
            <ComboBox.InputGroup>
                <Input placeholder="Rechercher…" />
                <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
                <ListBox items={options}>
                    {(o: { value: string; label: string }) => (
                        <ListBox.Item id={o.value} textValue={o.label}>
                            {o.label}
                            <ListBox.ItemIndicator />
                        </ListBox.Item>
                    )}
                </ListBox>
            </ComboBox.Popover>
        </ComboBox>
    );
}

export function TicketMobileCard({
    ticket: rowTicket,
    meta,
    isSelected,
    onToggleSelect,
}: {
    ticket: Ticket;
    meta: TicketColumnMeta;
    isSelected: boolean;
    onToggleSelect: (value: boolean) => void;
}) {
    const ticket = meta.getDisplayTicket(rowTicket);
    const estNouveau = meta.newTicketIds.has(ticket.id);
    const enEdition = estNouveau || meta.editingIds.has(ticket.id);

    const authentifieOptimiste = meta.authenticatedIds.has(ticket.id);
    const statutEffectif = authentifieOptimiste ? 'AUTHENTIFIE' : (ticket.statutControle ?? 'PENDING');
    const peutAuthentifier =
        !estNouveau &&
        meta.permissions.canAuthentifier &&
        (statutEffectif === 'PENDING' || statutEffectif === 'TARDIF');

    const statutOrigine = rowTicket.statutControle;
    const mutable = !statutOrigine || MODIFIABLE_STATUTS.has(statutOrigine);
    // L'admin/direction peut modifier ET supprimer un ticket quel que soit son statut (V2 inclus).
    const peutModifier = meta.permissions.isAdmin || mutable;
    // Le droit de SUPPRIMER etait ignore ici comme dans les colonnes : seul `canUpdate`
    // gardait la corbeille. Un role sans `delete` la voyait active.
    const peutSupprimer = meta.permissions.canDelete && (meta.permissions.isAdmin || mutable);

    return (
        <Card className={cn('gap-2 p-4', isSelected && 'border-accent bg-accent-soft/40')}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    {enEdition ? (
                        <TextField onChange={(v) => meta.onTicketChange(ticket.id, 'code', v)} value={ticket.code ?? ''}>
                            <Label>Code check</Label>
                            <Input autoComplete="off" placeholder="0000000" />
                        </TextField>
                    ) : (
                        <>
                            <p className="text-xs text-muted">Code check</p>
                            <p className="truncate text-sm font-semibold text-foreground">{ticket.code}</p>
                        </>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {!enEdition && <StatutTicket statut={statutEffectif} />}
                    {/* La case fait 16 px de cote, sur la SEULE surface tactile de
                        l'ecran. La regle des cibles demande 44 px. La marge negative porte
                        la cible sans changer d'un pixel ce qui est dessine.

                        L'enveloppe etait un `<label>` autour d'un `<button>` : le
                        `Checkbox.Content` de la bibliotheque EST deja le `<label>`, et
                        c'est donc lui qui doit porter la cible — la racine n'est qu'un div
                        de champ, l'agrandir n'aurait rien donne au doigt. */}
                    <Checkbox
                        aria-label="Sélectionner la ligne"
                        isDisabled={estNouveau}
                        isSelected={isSelected}
                        onChange={(coche) => onToggleSelect(coche)}
                        slot={null}
                    >
                        <Checkbox.Content className="-m-3.5 size-11 justify-center">
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                        </Checkbox.Content>
                    </Checkbox>
                </div>
            </div>

            {enEdition ? (
                <Liste
                    libelle="Livreur"
                    onChoix={(v) => meta.onTicketChange(ticket.id, 'livreurId', v)}
                    options={meta.livreurOptions}
                    valeur={ticket.livreurId}
                />
            ) : (
                <Champ libelle="Livreur">{ticket.livreur}</Champ>
            )}

            {enEdition ? (
                <Liste
                    libelle="Partenaire"
                    onChoix={(v) => meta.onTicketChange(ticket.id, 'restaurantId', v)}
                    options={meta.restaurantOptions}
                    valeur={ticket.restaurantId}
                />
            ) : (
                <Champ libelle="Partenaire">{ticket.restaurant}</Champ>
            )}

            {enEdition ? (
                <SelecteurZone
                    onPatch={meta.onTicketPatch}
                    restaurantId={ticket.restaurantId}
                    ticketId={ticket.id}
                    zoneId={ticket.zoneId}
                />
            ) : (
                <Champ libelle="Zone">{ticket.nomZone ?? 'Inconnue'}</Champ>
            )}

            {enEdition ? (
                <NumberField
                    isDisabled={!ticket.restaurantId}
                    minValue={0}
                    onChange={(v) =>
                        meta.onTicketChange(ticket.id, 'montantLivraison', Number.isFinite(v) ? String(v) : '')
                    }
                    value={Number(ticket.montantLivraison) || 0}
                >
                    <Label>Montant de livraison</Label>
                    <NumberField.Group>
                        <NumberField.DecrementButton />
                        <NumberField.Input />
                        <NumberField.IncrementButton />
                    </NumberField.Group>
                </NumberField>
            ) : (
                <Champ chiffre libelle="Montant de livraison">{formatCFA(ticket.montantLivraison)}</Champ>
            )}

            {enEdition ? (
                <NumberField
                    minValue={0}
                    onChange={(v) =>
                        meta.onTicketChange(ticket.id, 'montantCommande', Number.isFinite(v) ? String(v) : '')
                    }
                    value={Number(ticket.montantCommande) || 0}
                >
                    <Label>Montant de commande</Label>
                    <NumberField.Group>
                        <NumberField.DecrementButton />
                        <NumberField.Input />
                        <NumberField.IncrementButton />
                    </NumberField.Group>
                </NumberField>
            ) : (
                <Champ chiffre libelle="Montant de commande">{formatCFA(ticket.montantCommande)}</Champ>
            )}

            {/*
             * La commission vient du SERVEUR. Le champ lisait `coutLivraison ?? commission`,
             * donc le COUT DE LIVRAISON sous le libelle « Commission » sur un ticket
             * enregistre. Le serveur la resout depuis la version active a la DATE de la
             * course et depuis la ZONE : l'ecran ne peut pas la deviner.
             */}
            {enEdition ? (
                <TextField isReadOnly value={commissionAffichee(ticket)}>
                    <Label>Commission</Label>
                    <Input placeholder="À l'enregistrement" />
                </TextField>
            ) : (
                <Champ chiffre libelle="Commission">{formatCFA(ticket?.commission ?? 0)}</Champ>
            )}

            {enEdition ? (
                <DatePicker
                    onChange={(d: DateValue | null) => meta.onTicketChange(ticket.id, 'date', d ? d.toString() : '')}
                    value={enCalendaire(ticket.date)}
                >
                    <Label>Date</Label>
                    <DateField.Group>
                        <DateField.Input>
                            {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
                                <DateField.Segment segment={segment} />
                            )}
                        </DateField.Input>
                        <DatePicker.Trigger>
                            <DatePicker.TriggerIndicator />
                        </DatePicker.Trigger>
                    </DateField.Group>
                    <DatePicker.Popover>
                        <Calendar>
                            <Calendar.Header>
                                <Calendar.NavButton slot="previous">
                                    <ChevronLeft aria-hidden="true" className="size-4" />
                                </Calendar.NavButton>
                                <Calendar.Heading />
                                <Calendar.NavButton slot="next">
                                    <ChevronRight aria-hidden="true" className="size-4" />
                                </Calendar.NavButton>
                            </Calendar.Header>
                            <Calendar.Grid>
                                <Calendar.GridHeader>
                                    {(jour: string) => <Calendar.HeaderCell>{jour}</Calendar.HeaderCell>}
                                </Calendar.GridHeader>
                                <Calendar.GridBody>
                                    {(date: CalendarDate) => <Calendar.Cell date={date} />}
                                </Calendar.GridBody>
                            </Calendar.Grid>
                        </Calendar>
                    </DatePicker.Popover>
                </DatePicker>
            ) : (
                <Champ libelle="Date">{formatDateFR(ticket.date)}</Champ>
            )}

            {enEdition ? (
                <TimeField
                    onChange={(h: Time | null) =>
                        meta.onTicketChange(
                            ticket.id,
                            'heure',
                            h ? `${String(h.hour).padStart(2, '0')}:${String(h.minute).padStart(2, '0')}` : '',
                        )
                    }
                    value={enHeure(ticket.heure)}
                >
                    <Label>Heure</Label>
                    <TimeField.Group>
                        <TimeField.Input>
                            {(segment: React.ComponentProps<typeof TimeField.Segment>['segment']) => (
                                <TimeField.Segment segment={segment} />
                            )}
                        </TimeField.Input>
                    </TimeField.Group>
                </TimeField>
            ) : (
                <Champ libelle="Heure">{formatHoursMinutes(ticket.heure)}</Champ>
            )}

            {!enEdition && (
                <Champ libelle="Créé par">
                    {rowTicket.createdByUser
                        ? `${rowTicket.createdByUser.prenoms} ${rowTicket.createdByUser.nom}`
                        : '—'}
                </Champ>
            )}

            {/*
             * Les actions occupent toute la largeur : au doigt, une cible pleine largeur se
             * touche sans viser. La regle des 44 px est tenue par la taille par defaut des
             * boutons de la bibliotheque.
             */}
            <div className="flex items-center gap-2 pt-1">
                {estNouveau ? (
                    <>
                        <Button
                            className="flex-1"
                            isPending={meta.isSavingNew}
                            onPress={() => meta.onSaveNew(ticket.id)}
                            variant="primary"
                        >
                            {meta.isSavingNew ? <Spinner color="current" size="sm" /> : <Check aria-hidden="true" className="size-4" />}
                            Enregistrer
                        </Button>
                        <Button className="flex-1" onPress={() => meta.onCancelNew(ticket.id)} variant="ghost">
                            <X aria-hidden="true" className="size-4" />
                            Annuler
                        </Button>
                    </>
                ) : meta.editingIds.has(ticket.id) ? (
                    <>
                        <Tooltip>
                            <Button
                                className="flex-1"
                                isDisabled={!meta.permissions.canUpdate}
                                isPending={meta.isSavingEdit}
                                onPress={() => meta.onSaveEdit(ticket.id)}
                                variant="primary"
                            >
                                {meta.isSavingEdit ? <Spinner color="current" size="sm" /> : <Check aria-hidden="true" className="size-4" />}
                                Enregistrer
                            </Button>
                            <Tooltip.Content>
                                {meta.permissions.canUpdate
                                    ? 'Enregistrer les modifications'
                                    : "Votre rôle ne permet pas d'enregistrer les modifications d'un ticket"}
                            </Tooltip.Content>
                        </Tooltip>
                        <Button className="flex-1" onPress={() => meta.onCancelEdit(ticket.id)} variant="ghost">
                            <X aria-hidden="true" className="size-4" />
                            Annuler
                        </Button>
                    </>
                ) : (
                    <>
                        {peutAuthentifier && (
                            <Button
                                className="flex-1"
                                onPress={() => meta.onAuthentifier(ticket.id)}
                                variant="secondary"
                            >
                                <ShieldCheck aria-hidden="true" className="size-4" />
                                Authentifier
                            </Button>
                        )}
                        {meta.permissions.canUpdate && (
                            <Tooltip>
                                <Button
                                    className="flex-1"
                                    isDisabled={!peutModifier}
                                    onPress={() => meta.onEditRow(ticket.id)}
                                    variant="ghost"
                                >
                                    <Pen aria-hidden="true" className="size-4" />
                                    Modifier
                                </Button>
                                <Tooltip.Content>
                                    {peutModifier ? 'Modifier ce ticket' : "Ce ticket n'est pas modifiable"}
                                </Tooltip.Content>
                            </Tooltip>
                        )}
                        {meta.permissions.canUpdate && (
                            <Tooltip>
                                <Button
                                    className="flex-1"
                                    isDisabled={!peutSupprimer}
                                    onPress={() => meta.onDeleteRow(ticket.id)}
                                    variant="danger-soft"
                                >
                                    <Trash2 aria-hidden="true" className="size-4" />
                                    Supprimer
                                </Button>
                                <Tooltip.Content>
                                    {peutSupprimer ? 'Supprimer ce ticket' : "Ce ticket n'est pas supprimable"}
                                </Tooltip.Content>
                            </Tooltip>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
}
