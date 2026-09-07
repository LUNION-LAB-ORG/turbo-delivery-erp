'use client';

import {
    Button,
    Card,
    Chip,
    ComboBox,
    DateField,
    DatePicker,
    Input,
    Label,
    ListBox,
    NumberField,
    Calendar,
    Separator,
} from '@heroui-v3/react';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

/**
 * Le plan de saisie : l'etabli, separe de l'archive.
 *
 * <h3>Ce que l'ecran faisait, et pourquoi il fatiguait</h3>
 * <p>La page des tickets melange DEUX activites opposees sur une seule surface. D'un
 * cote SAISIR — concentre, repetitif, sur une poignee de lignes qu'on remplit depuis une
 * liasse de tickets papier. De l'autre CONSULTER — chercher dans un millier
 * d'enregistrements. Elles n'ont ni le meme rythme, ni la meme densite, ni les memes
 * gestes.</p>
 *
 * <p>Le geste principal — preparer N lignes pour un restaurant, un livreur et une date —
 * tenait dans cinq petits champs poses au-dessus d'un tableau de 1 037 lignes. Et les
 * lignes en cours de saisie apparaissaient DANS ce tableau, visuellement identiques aux
 * 1 037 autres : rien ne disait ou l'on en etait, ni combien il restait a remplir.</p>
 *
 * <h3>Ce que ce composant change</h3>
 * <ul>
 *   <li>Le lot se declare une fois — restaurant, livreur, date — et ces trois valeurs
 *       restent AFFICHEES pendant toute la saisie. On sait pour qui on saisit.</li>
 *   <li>L'avancement est un compte, pas une impression : « 7 sur 12 saisis ».</li>
 *   <li>L'accent de marque ne sert qu'ici : c'est la seule zone de l'ecran qui appelle
 *       un geste. Le vert du bouton d'origine ne disait rien — le vert est la couleur
 *       d'un statut valide dans cet ecran, pas celle d'une action.</li>
 * </ul>
 */

export interface OptionSaisie {
    value: string;
    label: string;
}

export interface EtatPlanSaisie {
    nombreLignes: number;
    livreurId: string;
    restaurantId: string;
    date: string;
    setNombreLignes: (v: number) => void;
    setLivreurId: (v: string) => void;
    setRestaurantId: (v: string) => void;
    setDate: (v: string) => void;
}

interface PlanSaisieProps {
    livreurs: OptionSaisie[];
    restaurants: OptionSaisie[];
    etat: EtatPlanSaisie;
    onPreparer: () => void;
    peutCreer: boolean;
    /** Nombre de lignes preparees et nombre deja completees. */
    preparees: number;
    completees: number;
    /** Delai avant verrouillage du creneau, si connu. */
    heuresAvantVerrouillage?: number;
}

/** « 2026-09-03 » vers une date calendaire, sans heure ni fuseau. */
function enDateCalendaire(iso: string): CalendarDate | null {
    const [a, m, j] = iso.split('-').map(Number);
    return a && m && j ? new CalendarDate(a, m, j) : null;
}

export function PlanSaisie({
    livreurs,
    restaurants,
    etat,
    onPreparer,
    peutCreer,
    preparees,
    completees,
    heuresAvantVerrouillage,
}: PlanSaisieProps) {
    const enCours = preparees > 0;
    const restant = Math.max(0, preparees - completees);
    /*
     * Preparer des lignes n'exige QUE leur nombre.
     *
     * <p>La barre precedente ne gardait que le droit de creer : on pouvait inserer N
     * lignes vierges et renseigner livreur et partenaire ligne par ligne. Exiger les
     * trois valeurs en tete fermait cette porte, et avec elle le cas le plus courant de
     * fin de service : une liasse qui melange trois livreurs et deux restaurants ne
     * pouvait plus etre preparee en un seul lot.</p>
     *
     * <p>Les trois champs restent des PREREMPLISSAGES, ce qu'ils ont toujours ete : ils
     * evitent de ressaisir douze fois la meme chose quand la liasse est homogene, et
     * chaque ligne reste modifiable ensuite.</p>
     */
    const pret = etat.nombreLignes > 0;

    return (
        <Card className="gap-3 border border-accent/20">
            <Card.Header>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Card.Title className="text-sm">Saisir un lot de tickets</Card.Title>
                        <Card.Description>
                            Déclarez le restaurant, le livreur et la date une seule fois, puis remplissez
                            les codes.
                        </Card.Description>
                    </div>

                    {/* Le verrouillage gouverne toute l'activite : il se voit ici, pas ailleurs. */}
                    {heuresAvantVerrouillage !== undefined && heuresAvantVerrouillage <= 48 && (
                        <Chip size="sm" variant="soft">
                            Verrouillage dans {heuresAvantVerrouillage} h
                        </Chip>
                    )}
                </div>
            </Card.Header>

            <Card.Content className="gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_auto]">
                    <ComboBox
                        onSelectionChange={(cle) => etat.setRestaurantId(String(cle ?? ''))}
                        selectedKey={etat.restaurantId || null}
                    >
                        <Label>Restaurant</Label>
                        <ComboBox.InputGroup>
                            <Input placeholder="Rechercher…" />
                            <ComboBox.Trigger />
                        </ComboBox.InputGroup>
                        <ComboBox.Popover>
                            <ListBox items={restaurants}>
                                {(o: OptionSaisie) => (
                                    <ListBox.Item id={o.value} textValue={o.label}>
                                        {o.label}
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                )}
                            </ListBox>
                        </ComboBox.Popover>
                    </ComboBox>

                    <ComboBox
                        onSelectionChange={(cle) => etat.setLivreurId(String(cle ?? ''))}
                        selectedKey={etat.livreurId || null}
                    >
                        <Label>Livreur</Label>
                        <ComboBox.InputGroup>
                            <Input placeholder="Rechercher…" />
                            <ComboBox.Trigger />
                        </ComboBox.InputGroup>
                        <ComboBox.Popover>
                            <ListBox items={livreurs}>
                                {(o: OptionSaisie) => (
                                    <ListBox.Item id={o.value} textValue={o.label}>
                                        {o.label}
                                        <ListBox.ItemIndicator />
                                    </ListBox.Item>
                                )}
                            </ListBox>
                        </ComboBox.Popover>
                    </ComboBox>

                    <DatePicker
                        onChange={(d: DateValue | null) => etat.setDate(d ? d.toString() : '')}
                        value={etat.date ? enDateCalendaire(etat.date) : null}
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
                        {/*
                          * `Calendar`, PAS `RangeCalendar`.
                          *
                          * <p>Un `DatePicker` fournit `CalendarContext` ; `RangeCalendar`
                          * consomme `RangeCalendarContext`, que seul un `DateRangePicker`
                          * fournit. Le calendrier ne recevait donc ni valeur ni
                          * gestionnaire : il s'affichait en composant autonome, cliquer un
                          * jour ne changeait rien, et le popover ne se refermait pas.</p>
                          *
                          * <p>Consequence : l'operateur ouvrait le calendrier pour saisir
                          * la liasse de la veille, cliquait le bon jour, et le lot partait
                          * quand meme a la date du jour. Toute la liasse se retrouvait
                          * rattachee au mauvais creneau, donc a la mauvaise semaine de
                          * paie. L'ancien champ de date natif, lui, fonctionnait.</p>
                          */}
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

                    {/*
                     * Largeur bornee : le champ vit dans une colonne `auto` de la grille,
                     * mais son entree s'etale sur toute la place restante. Un nombre de
                     * lignes tient sur deux chiffres — il occupait la largeur d'un champ de
                     * recherche.
                     */}
                    <NumberField
                        className="w-32"
                        minValue={1}
                        onChange={(v) => etat.setNombreLignes(Number.isFinite(v) ? v : 1)}
                        value={etat.nombreLignes}
                    >
                        <Label>Lignes</Label>
                        <NumberField.Group>
                            <NumberField.DecrementButton />
                            <NumberField.Input className="w-full text-center" />
                            <NumberField.IncrementButton />
                        </NumberField.Group>
                    </NumberField>

                    <div className="flex flex-col justify-end">
                        <Button isDisabled={!peutCreer || !pret} onPress={onPreparer}>
                            <Plus aria-hidden="true" className="size-4" />
                            Préparer {etat.nombreLignes > 1 ? `${etat.nombreLignes} lignes` : 'la ligne'}
                        </Button>
                    </div>
                </div>

                {!peutCreer && (
                    <p className="text-xs text-muted">
                        Votre rôle ne permet pas de créer un ticket.
                    </p>
                )}

                {enCours && (
                    <>
                        <Separator />
                        {/*
                         * L'avancement est un COMPTE, pas une impression. Les lignes en cours
                         * de saisie se perdaient parmi les 1 037 du tableau : rien ne disait
                         * combien restaient a remplir.
                         */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <span className="flex items-center gap-2 text-sm">
                                <Check
                                    aria-hidden="true"
                                    className={cn(
                                        'size-4',
                                        restant === 0 ? 'text-green-800 dark:text-green-400' : 'text-muted',
                                    )}
                                />
                                <span className="tabular-nums font-semibold">
                                    {completees} sur {preparees}
                                </span>
                                <span className="text-muted">saisis</span>
                            </span>

                            {restant > 0 && (
                                <span className="text-sm text-muted">
                                    {restant} ligne{restant > 1 ? 's' : ''} à compléter
                                </span>
                            )}

                            <div
                                aria-label={`${completees} lignes saisies sur ${preparees}`}
                                aria-valuemax={preparees}
                                aria-valuemin={0}
                                aria-valuenow={completees}
                                className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-surface-secondary"
                                role="progressbar"
                            >
                                <div
                                    className="h-full rounded-full bg-accent transition-[width]"
                                    style={{ width: `${preparees ? (completees / preparees) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    </>
                )}
            </Card.Content>
        </Card>
    );
}
