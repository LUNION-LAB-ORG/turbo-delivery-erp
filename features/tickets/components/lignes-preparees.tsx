'use client';

import {
    Button,
    Calendar,
    Card,
    ComboBox,
    DateField,
    DatePicker,
    Input,
    Label,
    ListBox,
    NumberField,
    Separator,
    TextField,
    TimeField,
} from '@heroui-v3/react';
import { CalendarDate, Time, type DateValue } from '@internationalized/date';
import { Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';

import { estVersionPerimee, signalerVersionPerimee } from '@/features/tickets/utils/version-perimee';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/types/bon-livraison.model';
import type { Restaurant } from '@/types/models';

import { SelecteurZone } from './selecteur-zone';

/**
 * Les lignes preparees, saisies DANS l'etabli.
 *
 * <p>Elles etaient inserees au sommet du tableau d'archive, ou 1 037 lignes deja
 * enregistrees les entouraient. Rien ne les distinguait : ni bordure, ni position stable
 * — un tri ou un filtre les dispersait — ni indication de ce qu'il restait a remplir. On
 * saisissait a l'aveugle, dans un tableau a quatorze colonnes dont onze ne concernent pas
 * la saisie.</p>
 *
 * <h3>Ce qui change</h3>
 * <ul>
 *   <li>La saisie a sa propre surface. Les lignes ne se melangent plus aux archives, un
 *       tri ne les disperse plus.</li>
 *   <li>Une ligne complete se marque d'un vu ; les incompletes gardent le lisere d'accent.
 *       On voit ou reprendre sans relire.</li>
 *   <li>Un seul bouton enregistre le lot. L'ancien ecran demandait de valider ligne par
 *       ligne, soit douze allers-retours pour une liasse de douze tickets.</li>
 * </ul>
 *
 * <p><b>Aucun champ n'a ete retire</b> : les neuf que l'ancienne ligne rendait saisissables
 * sont la, y compris le livreur, le partenaire et la date que le plan preremplit. Une
 * liasse contient parfois un ticket d'un autre livreur ou d'une autre date.</p>
 */

interface Option {
    value: string;
    label: string;
}

interface LignesPrepareesProps {
    tickets: Ticket[];
    livreurOptions: Option[];
    restaurantOptions: Option[];
    /**
     * Les partenaires COMPLETS, avec leur type de commission et leur taux.
     *
     * <p>Le composant ne recevait que des couples valeur/libelle : il ne pouvait pas
     * calculer la commission lui-meme, et se contentait donc d'afficher un champ ecrit
     * ailleurs. C'est cette indirection qui laissait l'ecran et le serveur diverger.</p>
     */
    restaurants: Restaurant[];
    onChange: (id: string, champ: keyof Ticket, valeur: string) => void;
    onPatch: (id: string, patch: Partial<Ticket>) => void;
    onRetirer: (id: string) => void;
    /**
     * Enregistre le LOT en une fois et rend le compte de ce qui est passe.
     *
     * <p>Il ne s'agit pas d'une commodite. Boucler sur un enregistrement unitaire
     * n'aurait retire qu'une seule ligne de l'ecran sur N : les N appels visent la meme
     * instance de mutation, qui ne notifie que le dernier. Les tickets partaient tous,
     * mais l'ecran laissait croire a un echec et l'operateur recliquait, creant autant
     * de doublons.</p>
     */
    onEnregistrerLot: (ids: string[]) => Promise<{
        echoues: number;
        /** Les messages du serveur, dedoublonnes : sans eux, un echec ne dit pas pourquoi. */
        raisons?: string[];
        reussis: number;
    }>;
    enregistrement?: boolean;
}

/** « 2026-09-04 » vers une date calendaire, sans heure ni fuseau. */
function enDateCalendaire(iso: string): CalendarDate | null {
    const [a, m, j] = (iso ?? '').split('-').map(Number);
    return a && m && j ? new CalendarDate(a, m, j) : null;
}

/**
 * « 19h22 », « 19:22 », « 19:22:04 » ou « 1922 » vers une heure typee.
 *
 * <p>Le modele stocke l'heure en chaine libre — `toLocaleTimeString('fr-FR')` a
 * l'insertion, soit « 19:22:04 ». Ces ecritures doivent toutes etre relues, sinon une
 * ligne fraichement inseree afficherait une heure vide.</p>
 */
function enHeure(v: string): Time | null {
    const m = (v ?? '').match(/^(\d{1,2})\s*[h:]?\s*(\d{2})/);
    if (!m) return null;
    const [h, min] = [Number(m[1]), Number(m[2])];
    return h < 24 && min < 60 ? new Time(h, min) : null;
}

/** Une ligne est complete quand tout ce qui se saisit est renseigne. */
export const ligneComplete = (t: Ticket) =>
    Boolean(
        (t.code ?? '').trim() &&
            t.livreurId &&
            t.restaurantId &&
            t.zoneId &&
            Number(t.montantLivraison) > 0 &&
            t.date,
    );

export function LignesPreparees({
    tickets,
    livreurOptions,
    restaurantOptions,
    restaurants,
    onChange,
    onPatch,
    onRetirer,
    onEnregistrerLot,
    enregistrement = false,
}: LignesPrepareesProps) {
    // Un envoi en cours BLOQUE le bouton. Sans cela, deux clics rapides envoient deux
    // fois la meme liasse : la creation n'a pas de garde d'unicite en base.
    const [envoiEnCours, setEnvoiEnCours] = React.useState(false);

    if (tickets.length === 0) return null;

    const completes = tickets.filter(ligneComplete);
    const toutesCompletes = completes.length === tickets.length;

    const enregistrerLeLot = async () => {
        if (envoiEnCours || completes.length === 0) return;
        setEnvoiEnCours(true);
        try {
            const { echoues, raisons, reussis } = await onEnregistrerLot(completes.map((t) => t.id));
            if (echoues > 0 && (raisons ?? []).some(estVersionPerimee)) {
                // Ni un champ manquant ni un droit refuse : la page est en retard sur le
                // serveur. `signalerVersionPerimee` le dit et recharge, une seule fois,
                // parce que les lignes en saisie sont gardees dans le navigateur.
                signalerVersionPerimee();
            } else if (echoues > 0) {
                toast.warning(
                    `${reussis} ticket${reussis > 1 ? 's' : ''} enregistré${reussis > 1 ? 's' : ''}, ${echoues} en échec.`,
                    {
                        /*
                         * La RAISON, pas seulement le compte. « 0 enregistre, 7 en echec »
                         * ne dit pas a l'operateur s'il manque un champ, si le serveur est
                         * tombe, ou si son role ne le permet pas — donc a qui poser la
                         * question. Le message du serveur remonte ici, et la duree est
                         * allongee : un echec se lit, il ne se rate pas.
                         */
                        description:
                            raisons && raisons.length > 0
                                ? `${raisons.join(' · ')} — les lignes en échec restent affichées ci-dessus.`
                                : 'Les lignes en échec restent affichées ci-dessus.',
                        duration: 15000,
                    },
                );
            } else if (reussis > 0) {
                toast.success(`${reussis} ticket${reussis > 1 ? 's' : ''} enregistré${reussis > 1 ? 's' : ''}.`);
            }
        } finally {
            setEnvoiEnCours(false);
        }
    };

    return (
        <Card className="gap-3">
            <Card.Header>
                <Card.Title className="text-sm">
                    {tickets.length} ligne{tickets.length > 1 ? 's' : ''} à saisir
                </Card.Title>
                <Card.Description>
                    {completes.length} sur {tickets.length} complètes
                </Card.Description>
            </Card.Header>

            <Card.Content className="gap-2">
                {tickets.map((t, i) => {
                    const complete = ligneComplete(t);
                    return (
                        <div
                            className={cn(
                                'rounded-lg border p-2.5',
                                complete
                                    ? 'border-separator bg-surface-secondary/40'
                                    : 'border-accent/25 bg-accent-soft/30',
                            )}
                            key={t.id}
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <span
                                    className={cn(
                                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                                        // Un disque vert plein pesait autant qu'une alerte pour
                                        // dire « c'est fait ». Le vu suffit : trait vert sur
                                        // fond tres pale, lisible sans crier.
                                        // MESURE : `text-accent` sur `bg-accent-soft` rendait
                                        // 3,08:1, sous le seuil de 4,5:1 — le numero de ticket
                                        // etait a peine lisible. Le fond teinte suffit a dire
                                        // « pas encore fait » ; le chiffre reprend la couleur du
                                        // texte courant et redevient net.
                                        complete
                                            ? 'bg-green-100 text-green-800 dark:bg-green-400/15 dark:text-green-400'
                                            : 'bg-accent-soft text-foreground',
                                    )}
                                >
                                    {complete ? <Check aria-hidden="true" className="size-3.5" /> : i + 1}
                                </span>
                                <span className="text-xs text-muted">Ticket {i + 1}</span>
                                <Button
                                    aria-label={`Retirer la ligne ${i + 1}`}
                                    className="ms-auto"
                                    isIconOnly
                                    onPress={() => onRetirer(t.id)}
                                    size="sm"
                                    variant="ghost"
                                >
                                    <Trash2 aria-hidden="true" className="size-4" />
                                </Button>
                            </div>

                            {/*
                             * DEUX BANDES, alignees sur douze colonnes.
                             *
                             * <p>Un remplissage automatique laissait le hasard decider : neuf
                             * champs se rangeaient en sept plus deux, avec un trou beant en fin
                             * de seconde rangee et des cases collees les unes aux autres. Ici la
                             * coupure est CHOISIE et suit le geste de saisie :</p>
                             * <ul>
                             *   <li>rangee 1 — de QUI et d'OU il s'agit : code, livreur,
                             *       partenaire, zone ; quatre colonnes de trois ;</li>
                             *   <li>rangee 2 — COMBIEN et QUAND : les trois montants sur deux
                             *       colonnes chacun, la date et l'heure sur trois. Douze aussi,
                             *       donc les deux rangees s'alignent au pixel.</li>
                             * </ul>
                             * <p>Les douziemes sont poses sur les composants eux-memes : le
                             * placement dans une grille ne peut vivre que sur l'enfant, et la
                             * bibliotheque documente `className` pour cet usage. Aucune de ces
                             * classes ne touche a l'apparence.</p>
                             */}
                            <div className="grid grid-cols-1 items-start gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-12">
                                {/*
                                 * Saisir le code HORODATE la ligne : l'heure se remplit de
                                 * l'heure courante si elle est encore vide. Le code est le
                                 * premier geste sur un ticket — c'est donc lui qui marque le
                                 * moment de la saisie, et cela evite de porter douze fois la
                                 * meme heure a la main. Une heure DEJA renseignee n'est jamais
                                 * ecrasee : elle vient du ticket papier, pas de la pendule.
                                 */}
                                <TextField
                                    className="lg:col-span-3"
                                    onChange={(v) => {
                                        if (v && !enHeure(t.heure)) {
                                            const maintenant = new Date();
                                            onPatch(t.id, {
                                                code: v,
                                                heure: `${String(maintenant.getHours()).padStart(2, '0')}:${String(maintenant.getMinutes()).padStart(2, '0')}`,
                                            });
                                            return;
                                        }
                                        onChange(t.id, 'code', v);
                                    }}
                                    value={t.code ?? ''}
                                >
                                    <Label>Code check</Label>
                                    <Input autoComplete="off" placeholder="0000000" />
                                </TextField>

                                {/*
                                 * Une liste FILTRABLE, pas un menu deroulant. Le parc compte
                                 * 222 livreurs : les faire defiler pour en trouver un est
                                 * intenable, et le selecteur d'origine se cherchait au clavier.
                                 * Retirer la recherche aurait retire une capacite existante.
                                 */}
                                <ComboBox
                                    className="lg:col-span-3"
                                    onSelectionChange={(c) => onChange(t.id, 'livreurId', String(c ?? ''))}
                                    selectedKey={t.livreurId || null}
                                >
                                    <Label>Livreur</Label>
                                    <ComboBox.InputGroup>
                                        <Input placeholder="Rechercher…" />
                                        <ComboBox.Trigger />
                                    </ComboBox.InputGroup>
                                    <ComboBox.Popover>
                                        <ListBox items={livreurOptions}>
                                            {(o: Option) => (
                                                <ListBox.Item id={o.value} textValue={o.label}>
                                                    {o.label}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            )}
                                        </ListBox>
                                    </ComboBox.Popover>
                                </ComboBox>

                                {/*
                                 * Changer de partenaire recalcule la commission et invalide la
                                 * zone : la grille tarifaire est propre au partenaire, garder
                                 * l'ancienne zone conserverait un prix qui n'existe plus.
                                 */}
                                <ComboBox
                                    className="lg:col-span-3"
                                    onSelectionChange={(c) =>
                                        onPatch(t.id, {
                                            restaurantId: String(c ?? ''),
                                            restaurant:
                                                restaurantOptions.find((o) => o.value === String(c ?? ''))?.label ?? '',
                                            zoneId: undefined,
                                            nomZone: '',
                                        })
                                    }
                                    selectedKey={t.restaurantId || null}
                                >
                                    <Label>Partenaire</Label>
                                    <ComboBox.InputGroup>
                                        <Input placeholder="Rechercher…" />
                                        <ComboBox.Trigger />
                                    </ComboBox.InputGroup>
                                    <ComboBox.Popover>
                                        <ListBox items={restaurantOptions}>
                                            {(o: Option) => (
                                                <ListBox.Item id={o.value} textValue={o.label}>
                                                    {o.label}
                                                    <ListBox.ItemIndicator />
                                                </ListBox.Item>
                                            )}
                                        </ListBox>
                                    </ComboBox.Popover>
                                </ComboBox>

                                <SelecteurZone
                                    className="lg:col-span-3"
                                    onPatch={onPatch}
                                    restaurantId={t.restaurantId}
                                    ticketId={t.id}
                                    zoneId={t.zoneId}
                                />

                                {/* Sans partenaire il n'y a pas de tarif : le champ reste ferme. */}
                                <NumberField
                                    className="lg:col-span-2"
                                    isDisabled={!t.restaurantId}
                                    minValue={0}
                                    onChange={(v) =>
                                        onChange(t.id, 'montantLivraison', Number.isFinite(v) ? String(v) : '')
                                    }
                                    value={Number(t.montantLivraison) || 0}
                                >
                                    <Label>Livraison</Label>
                                    <NumberField.Group>
                                        <NumberField.DecrementButton />
                                        <NumberField.Input />
                                        <NumberField.IncrementButton />
                                    </NumberField.Group>
                                </NumberField>

                                <NumberField
                                    className="lg:col-span-2"
                                    minValue={0}
                                    onChange={(v) =>
                                        onChange(t.id, 'montantCommande', Number.isFinite(v) ? String(v) : '')
                                    }
                                    value={Number(t.montantCommande) || 0}
                                >
                                    <Label>Commande</Label>
                                    <NumberField.Group>
                                        <NumberField.DecrementButton />
                                        <NumberField.Input />
                                        <NumberField.IncrementButton />
                                    </NumberField.Group>
                                </NumberField>

                                {/*
                                 * La commission n'est pas connue de l'ecran.
                                 *
                                 * <p>Le champ a affiche successivement `coutLivraison`, puis une
                                 * valeur calculee ici. Les deux annonçaient 2 000 F pour une ligne
                                 * qui s'enregistrait a 200 F. Le serveur ne se sert pas de ce que
                                 * l'ERP lui envoie : il resout la commission depuis la version
                                 * active a la DATE de la course et depuis la ZONE, deux choses que
                                 * cet ecran n'a pas.</p>
                                 *
                                 * <p>Il ne devine donc plus. Le champ reste, pour dire que la
                                 * commission existe et qu'elle n'est pas a saisir, et il l'annonce
                                 * en toutes lettres.</p>
                                 */}
                                <TextField className="lg:col-span-2" isReadOnly value="">
                                    <Label>Commission</Label>
                                    <Input placeholder="À l'enregistrement" />
                                </TextField>

                                <DatePicker
                                    className="lg:col-span-3"
                                    onChange={(d: DateValue | null) =>
                                        onChange(t.id, 'date', d ? d.toString() : '')
                                    }
                                    value={enDateCalendaire(t.date)}
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
                                                    {(jour: string) => (
                                                        <Calendar.HeaderCell>{jour}</Calendar.HeaderCell>
                                                    )}
                                                </Calendar.GridHeader>
                                                <Calendar.GridBody>
                                                    {(date: CalendarDate) => <Calendar.Cell date={date} />}
                                                </Calendar.GridBody>
                                            </Calendar.Grid>
                                        </Calendar>
                                    </DatePicker.Popover>
                                </DatePicker>

                                {/*
                                 * Une heure se saisit par SEGMENTS — heures, puis minutes — et
                                 * non dans un champ libre qu'il faut ensuite interpreter. Le
                                 * segment refuse d'emblee une 25e heure ou une 61e minute.
                                 */}
                                <TimeField
                                    className="lg:col-span-3"
                                    onChange={(h: Time | null) =>
                                        onChange(
                                            t.id,
                                            'heure',
                                            h
                                                ? `${String(h.hour).padStart(2, '0')}:${String(h.minute).padStart(2, '0')}`
                                                : '',
                                        )
                                    }
                                    value={enHeure(t.heure)}
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
                            </div>
                        </div>
                    );
                })}

                <Separator />

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm text-muted">
                        {toutesCompletes
                            ? 'Toutes les lignes sont complètes.'
                            : `${tickets.length - completes.length} ligne${tickets.length - completes.length > 1 ? 's' : ''} incomplète${tickets.length - completes.length > 1 ? 's' : ''}.`}
                    </span>
                    {/*
                     * Un seul enregistrement pour le lot. L'ecran precedent demandait de valider
                     * ligne par ligne, soit douze allers-retours pour une liasse de douze
                     * tickets. Les lignes incompletes ne bloquent pas : celles qui sont pretes
                     * partent, les autres restent a l'ecran.
                     */}
                    <Button
                        isDisabled={completes.length === 0 || envoiEnCours}
                        isPending={envoiEnCours || enregistrement}
                        onPress={enregistrerLeLot}
                    >
                        Enregistrer {completes.length} ticket{completes.length > 1 ? 's' : ''}
                    </Button>
                </div>
            </Card.Content>
        </Card>
    );
}
