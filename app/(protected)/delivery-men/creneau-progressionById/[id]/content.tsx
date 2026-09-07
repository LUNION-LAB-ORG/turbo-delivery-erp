'use client';

/*
 * Le creneau d'un coursier, semaine par semaine.
 *
 * <h3>Ce qui change</h3>
 * <p>L'ecran s'ouvrait sur l'identite : une photo, puis trois colonnes de couples
 * libelle/valeur separees par des filets `border-black`, qui occupaient le premier tiers
 * de la page. L'operateur n'arrive pourtant pas ici pour apprendre le nom du coursier, il
 * vient de cliquer dessus dans une liste. Il vient voir CE QUI EST PLANIFIE. Le creneau
 * passe donc en premier et prend la largeur ; l'identite devient une colonne de reference
 * a droite, ou l'on va chercher un numero ou une immatriculation quand on en a besoin.</p>
 *
 * <p>Les journees etaient rendues comme un formulaire : un interrupteur par jour, fait
 * d'une `input type=checkbox` en `sr-only` sans gestionnaire et d'une pastille qui ne
 * bougeait jamais. Rien n'etait modifiable. Sept journees de meme forme, avec des heures
 * qui se comparent, c'est un tableau : heures a droite en chasse tabulaire, duree
 * calculee, et l'etat de la journee affiche comme un etat et non comme une commande.</p>
 *
 * <p>Le choix de la semaine etait une rangee de boutons a defilement horizontal. Un
 * coursier d'un an d'anciennete en aurait cinquante-deux. C'est une liste dans laquelle on
 * cherche : une ComboBox, doublee de deux fleches pour passer a la semaine voisine. Les
 * semaines sont rangees de la plus recente a la plus ancienne, et l'ecran s'ouvre sur la
 * plus recente, qui est celle qu'on vient regarder.</p>
 *
 * <p>Le rose ecrit en dur (`bg-pink-500`, `text-pink-500`) peignait l'onglet actif, les
 * interrupteurs, la consigne ET le message « Aucun creneau trouve » : une teinte hors
 * theme, sans variante sombre, qui disait quatre choses a la fois donc aucune. La couleur
 * ne sert plus qu'a deux choses ici : dire qu'une journee est travaillee, et signaler ce
 * qui manque.</p>
 *
 * <p>La colonne d'identite porte les memes valeurs qu'avant. Ce qui change est ce qu'on en
 * emporte : le NUMERO se recopie en un clic, parce que c'est la seule valeur qu'on sort
 * d'ici pour joindre le coursier ; l'identifiant garde son bouton, mais en bas de colonne.</p>
 *
 * <h3>Ce qui a ete retire, et pourquoi c'etait faux</h3>
 * <p>Deux lignes « ... / ... » livrees telles quelles en production ; une ligne « Debut du
 * creneau » dont la valeur etait la chaine vide ; le libelle « Inscription » pose sur
 * `birthDay`, qui est la date de NAISSANCE partout ailleurs dans le depot. Les quatre
 * squelettes affiches SOUS « Aucun creneau trouve » partent aussi : un squelette annonce
 * une donnee qui arrive, et il n'y en avait aucune a attendre.</p>
 *
 * <p>Trois autres retraits, pour etre complet. La consigne « Selectionnez les jours de
 * travail » part avec les interrupteurs : elle promettait un geste que l'ecran ne savait
 * pas faire. Le garde `EREUR 404` de `user.tsx` part parce qu'il etait mort : `page.tsx`
 * traite deja le cas du livreur introuvable avant de rendre cet ecran. Et l'import `Image`
 * de `next/image` disparait avec la photo, qui passe desormais par `Avatar`, au meme titre
 * que `Button`, `Input`, `Select`, `SelectItem`, `ArrowLeft` et `Edit`.</p>
 *
 * <p>Quand l'API ne transmet pas le detail des jours, l'ecran derivait les dates des bornes
 * du creneau, ce qui est legitime, mais posait `actif: false` sur chacune. Chaque journee
 * sortait donc avec son interrupteur eteint, c'est-a-dire annoncee comme un repos decide,
 * alors que rien n'etait su. Les horaires 08:00 - 22:00 du meme objet de repli, eux, n'ont
 * jamais ete montres : le bloc des heures etait garde par `actif`. Les dates restent, le
 * faux repos non : la semaine est alors annoncee comme non detaillee.</p>
 */

import { Avatar, Button, Card, Chip } from '@heroui-v3/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

import { ChampCopiable } from '@/components/commons/ChampCopiable';
import { ChampListe } from '@/components/commons/champs-formulaire';
import EmptyState from '@/components/commons/EmptyState';
import { TableauResponsive, type ColonneResponsive } from '@/components/commons/TableauResponsive';
import RetourButton from '@/components/dashboard/retourButton';
import { cn } from '@/lib/utils';
import type { CreneauID } from '@/types/creneau-byId';
import type { LivreurDetail } from '@/types/livreur';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

import useContentCtx from './useContentCtx';

const MOIS = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
];

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

/** Une valeur absente se lit comme absente, jamais comme une chaine vide. */
const TIRET = '-';

type TonPastille = 'default' | 'success' | 'warning';

/*
 * `LivreurDetail.type` est l'axe ASSIGNATION de la table livreurs : TURBO, FREE, WAITING,
 * ou rien. Ce n'est ni le contrat ni `typeLivreur`, qui est un AUTRE axe de la meme table.
 * Le vocabulaire vient de l'ecran de modification (delivery-men/men/[id]/edit-content.tsx),
 * seul endroit du depot ou ces valeurs etaient deja traduites : les rendre autrement ecrit
 * « Turbo » ou « Free » a l'endroit ou l'operateur attend un libelle, et laisse croire a un
 * niveau d'offre.
 */
const ASSIGNATION: Record<string, { couleur: TonPastille; libelle: string }> = {
    FREE: { couleur: 'default', libelle: 'Bird / Libre' },
    TURBO: { couleur: 'success', libelle: 'Assigné' },
    WAITING: { couleur: 'warning', libelle: "En attente d'assignation" },
};

/*
 * `null` est une valeur METIER sur cette colonne : le coursier n'a rien choisi, ou sa
 * demande d'assignation n'a pas ete traitee. C'est le cas que l'exploitation doit voir, la
 * ligne s'affiche donc toujours, et elle porte le ton d'alerte comme WAITING : une lacune,
 * pas une categorie. Une valeur servie hors des trois connues ressort telle quelle, car
 * ecrire un libelle faux vaut moins que montrer ce que porte la base.
 */
function assignationLisible(type?: null | string) {
    const brut = valeurUtile(type).toUpperCase();
    if (!brut) return { couleur: 'warning' as TonPastille, libelle: 'Non assigné' };
    return ASSIGNATION[brut] ?? { couleur: 'default' as TonPastille, libelle: String(type) };
}

/*
 * Le back sert parfois la chaine « null » plutot qu'un vide : sans ce filtre, la fiche
 * affichait le mot null comme s'il s'agissait du domicile du coursier. Le meme filtre est
 * pose sur la fiche coursier (delivery-men/[driver_id]/content.tsx), qui lit la meme source.
 */
function valeurUtile(valeur?: null | string) {
    const texte = String(valeur ?? '').trim();
    return texte.length === 0 || texte.toLowerCase() === 'null' ? '' : texte;
}

/*
 * Les dates arrivent en YYYY-MM-DD. Les decouper a la main plutot que de passer par `Date`
 * evite le decalage d'un jour : `new Date('2026-03-03')` se lit a minuit UTC, et un poste
 * a l'ouest de Greenwich affiche alors le 2.
 */
function partsDate(iso?: null | string) {
    const [annee, mois, jour] = (iso ?? '').slice(0, 10).split('-');
    const m = Number(mois);
    const j = Number(jour);
    if (!annee || !Number.isFinite(m) || !Number.isFinite(j) || m < 1 || m > 12) return null;
    return { annee, jour: j, mois: m };
}

function formatSemaine(debut?: null | string, fin?: null | string) {
    const d = partsDate(debut);
    const f = partsDate(fin);
    if (!d) return 'Semaine sans date';
    if (!f) return `Semaine du ${d.jour} ${MOIS[d.mois - 1]} ${d.annee}`;
    if (d.mois === f.mois && d.annee === f.annee) {
        return `Semaine du ${d.jour} au ${f.jour} ${MOIS[d.mois - 1]} ${d.annee}`;
    }
    return `Semaine du ${d.jour} ${MOIS[d.mois - 1]} au ${f.jour} ${MOIS[f.mois - 1]} ${f.annee}`;
}

function formatJourDate(iso?: null | string) {
    const d = partsDate(iso);
    return d ? `${d.jour} ${MOIS[d.mois - 1]}` : TIRET;
}

function formatDateComplete(iso?: null | string) {
    const d = partsDate(iso);
    return d ? `${d.jour} ${MOIS[d.mois - 1]} ${d.annee}` : TIRET;
}

/*
 * La naissance arrive en ISO, parfois horodatee. Brute, elle se lisait « 1994-03-17 » dans
 * une colonne ou toutes les autres dates sont en toutes lettres. Un format inattendu
 * ressort tel quel : un tiret effacerait une donnee que le back a bien servie.
 */
function formatNaissance(valeur?: null | string) {
    const brut = valeurUtile(valeur);
    if (!brut) return '';
    const d = partsDate(brut);
    return d ? `${d.jour} ${MOIS[d.mois - 1]} ${d.annee}` : brut;
}

/**
 * « LUNDI », « SUPERVISEUR_LIVREUR » : les valeurs de l'API arrivent en capitales et
 * soulignees. Sept lignes de capitales crient dans un tableau, on les rend en capitale
 * initiale.
 */
function formatEtiquette(valeur?: null | string) {
    if (!valeur) return TIRET;
    const texte = valeur.replace(/_/g, ' ').toLowerCase();
    return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function minutesDe(heure?: null | string) {
    if (!heure) return null;
    const [h, m] = heure.split(':');
    const H = Number(h);
    const M = Number(m ?? '0');
    if (!Number.isFinite(H) || !Number.isFinite(M)) return null;
    return H * 60 + M;
}

function formatHeure(heure?: null | string) {
    return minutesDe(heure) === null ? TIRET : heure!.slice(0, 5);
}

/** Une journee qui finit avant de commencer est une journee de nuit, pas une erreur. */
function dureeMinutes(debut?: null | string, fin?: null | string) {
    const a = minutesDe(debut);
    const b = minutesDe(fin);
    if (a === null || b === null) return null;
    return b >= a ? b - a : b - a + 24 * 60;
}

function formatDuree(m: null | number) {
    if (m === null) return TIRET;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r === 0 ? `${h} h` : `${h} h ${String(r).padStart(2, '0')}`;
}

function joursEntreBornes(debut?: null | string, fin?: null | string) {
    const liste: { date: string; nom: string }[] = [];
    const d0 = new Date(`${(debut ?? '').slice(0, 10)}T00:00:00`);
    const d1 = new Date(`${(fin ?? '').slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d0.getTime()) || Number.isNaN(d1.getTime()) || d1 < d0) return liste;
    for (const d = new Date(d0); d <= d1 && liste.length < 31; d.setDate(d.getDate() + 1)) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate(),
        ).padStart(2, '0')}`;
        liste.push({ date: iso, nom: JOURS[d.getDay()] });
    }
    return liste;
}

interface LigneJour {
    cle: string;
    date: string;
    debut: null | string;
    fin: null | string;
    minutes: null | number;
    nom: string;
    /** `null` : l'API n'a pas transmis le detail des jours, on ne sait pas. */
    planifie: boolean | null;
}

/**
 * Le cadre d'une ligne de la colonne d'identite : le libelle a gauche, la valeur a droite.
 *
 * <p>Le libelle est ce qui rend la valeur interpretable : sur une table livreurs qui porte
 * quatre axes distincts, une valeur posee seule ne dit pas de quel axe elle releve.</p>
 */
function LigneCadre({ children, libelle }: { children: React.ReactNode; libelle: string }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-1.5">
            <span className="shrink-0 text-xs text-muted">{libelle}</span>
            <div className="min-w-0 text-right text-sm">{children}</div>
        </div>
    );
}

/**
 * Une valeur textuelle de la colonne d'identite.
 *
 * <p>Les valeurs longues (courriel, adresse) tenaient dans une boite de 120 px en
 * `overflow-x-auto` : il fallait faire defiler un courriel a la molette pour le lire. Elles
 * reviennent maintenant a la ligne dans une colonne qui a toute la largeur de la carte,
 * plutot que d'etre coupees et rendues au survol.</p>
 */
function LigneInfo({
    chiffres,
    libelle,
    valeur,
}: {
    /** Une suite de chiffres qu'on recopie : chasse fixe, en plus des chiffres tabulaires. */
    chiffres?: boolean;
    libelle: string;
    valeur?: null | string;
}) {
    const texte = valeurUtile(valeur);
    return (
        <LigneCadre libelle={libelle}>
            {/*
              Chiffres tabulaires sur toutes les lignes : les numeros et les dates de la
              colonne s'alignent d'une ligne a l'autre, et le texte n'en bouge pas.
            */}
            <span
                className={cn(
                    'break-words tabular-nums',
                    texte ? 'text-foreground' : 'text-default-400',
                    chiffres && 'font-mono',
                )}
            >
                {texte || TIRET}
            </span>
        </LigneCadre>
    );
}

export default function Content({
    dataCreneau,
    user,
}: {
    dataCreneau: CreneauID[] | null;
    user: LivreurDetail;
}) {
    const { exerianceLivreur } = useContentCtx({ dataCreneau });

    /*
     * La plus recente d'abord : c'est la semaine qu'on vient consulter. L'ordre d'origine
     * etait celui de l'API, et l'ecran s'ouvrait donc sur une semaine quelconque.
     */
    const semaines = React.useMemo(
        () => [...(dataCreneau ?? [])].sort((a, b) => (b.debut ?? '').localeCompare(a.debut ?? '')),
        [dataCreneau],
    );

    const [semaineId, setSemaineId] = React.useState('');

    /*
     * La ComboBox rend `''` quand on efface le champ, et effacer arrive des qu'on tape une
     * recherche puis qu'on sort sans choisir. Sans ce garde, l'operateur etait renvoye
     * SILENCIEUSEMENT sur la semaine la plus recente. Vider le champ n'est pas un choix :
     * la semaine affichee ne bouge pas, et la ComboBox reprend son libelle.
     */
    const choisirSemaine = (id: string) => {
        if (id) setSemaineId(id);
    };

    /* Tant qu'aucune semaine n'a ete choisie, `''` ne correspond a rien : on ouvre sur la premiere. */
    const indexCourant = Math.max(
        0,
        semaines.findIndex((s) => s.id === semaineId),
    );
    const semaine = semaines[indexCourant] ?? null;

    const lignes = React.useMemo<LigneJour[]>(() => {
        if (!semaine) return [];
        const detail = semaine.jours ?? [];
        if (detail.length > 0) {
            return [...detail]
                .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
                .map((j, i) => ({
                    cle: `${j.date ?? 'jour'}-${i}`,
                    date: j.date,
                    debut: j.debut ?? null,
                    fin: j.fin ?? null,
                    minutes: j.actif ? dureeMinutes(j.debut, j.fin) : null,
                    nom: formatEtiquette(j.jour),
                    planifie: Boolean(j.actif),
                }));
        }
        return joursEntreBornes(semaine.debut, semaine.fin).map((j, i) => ({
            cle: `${j.date}-${i}`,
            date: j.date,
            debut: null,
            fin: null,
            minutes: null,
            nom: j.nom,
            planifie: null,
        }));
    }, [semaine]);

    const detailFourni = Boolean(semaine?.jours && semaine.jours.length > 0);
    const joursPlanifies = lignes.filter((l) => l.planifie === true).length;
    const totalMinutes = lignes.reduce((somme, l) => somme + (l.minutes ?? 0), 0);
    const premierCreneau = semaines.length > 0 ? semaines[semaines.length - 1].debut : null;

    /*
     * La seule colonne qui differencie les lignes. `color` porte l'echelle semantique, comme
     * sur `StatusChip` : « Non detaillee » n'est pas un etat de la journee, c'est une donnee
     * qui manque, et elle prend donc le ton d'alerte plutot que le gris du repos, qui lui est
     * connu. Le repos garde le neutre : il n'appelle rien.
     */
    const etatJournee = (planifie: boolean | null): { couleur: TonPastille; libelle: string } => {
        if (planifie === null) return { couleur: 'warning', libelle: 'Non détaillée' };
        return planifie
            ? { couleur: 'success', libelle: 'Planifiée' }
            : { couleur: 'default', libelle: 'Repos' };
    };

    const colonnes: readonly ColonneResponsive<LigneJour>[] = [
        {
            cle: 'jour',
            identite: true,
            libelle: 'Jour',
            rendu: (l) => (
                <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{l.nom}</p>
                    <p className="text-xs tabular-nums text-muted">{formatJourDate(l.date)}</p>
                </div>
            ),
        },
        {
            cle: 'etat',
            libelle: 'Journée',
            rendu: (l) => (
                <Chip color={etatJournee(l.planifie).couleur} size="sm" variant="soft">
                    <Chip.Label>{etatJournee(l.planifie).libelle}</Chip.Label>
                </Chip>
            ),
        },
        {
            cle: 'debut',
            libelle: 'Début',
            nombre: true,
            rendu: (l) => (l.planifie ? formatHeure(l.debut) : TIRET),
        },
        {
            cle: 'fin',
            libelle: 'Fin',
            nombre: true,
            rendu: (l) => (l.planifie ? formatHeure(l.fin) : TIRET),
        },
        {
            cle: 'duree',
            libelle: 'Durée',
            nombre: true,
            rendu: (l) => formatDuree(l.minutes),
        },
    ];

    const photo = user?.avatarUrl ? createUrlFile(user.avatarUrl, 'backend') : '';
    const nomComplet = `${user?.prenoms ?? ''} ${user?.nom ?? ''}`.trim();
    const assignation = assignationLisible(user?.type);
    const telephone = valeurUtile(user?.telephone);
    const identifiant = valeurUtile(user?.id);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <RetourButton />
                <Avatar className="size-12 shrink-0">
                    {photo && <Avatar.Image alt={`Photo de ${nomComplet}`} src={photo} />}
                    <Avatar.Fallback>{getInitials(nomComplet)}</Avatar.Fallback>
                </Avatar>
                <div className="min-w-0">
                    <h1 className="truncate text-xl font-semibold text-foreground">
                        {nomComplet || 'Coursier'}
                    </h1>
                </div>
            </div>

            {/*
              md: et non lg:. La fenetre du poste fait environ 1000 px de large, sous le
              seuil lg de 1024 px : une colonne declaree en lg: ne s'ouvrirait jamais chez
              l'operateur, qui lirait le creneau et l'identite l'un sous l'autre.
            */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <Card.Header className="gap-3">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold text-foreground">Créneaux</h2>
                                {semaines.length > 0 && (
                                    <p className="text-xs text-muted">
                                        {semaines.length} semaine
                                        {semaines.length > 1 ? 's enregistrées' : ' enregistrée'}
                                    </p>
                                )}
                            </div>
                            {semaines.length > 1 && (
                                <div className="flex w-full items-end gap-2 sm:w-auto">
                                    <div className="min-w-0 flex-1 sm:w-72 sm:flex-none">
                                        <ChampListe
                                            label="Semaine"
                                            onChange={choisirSemaine}
                                            options={semaines.map((s) => ({
                                                label: `${formatSemaine(s.debut, s.fin)}${s.semainePassee ? ' · terminée' : ''}`,
                                                value: s.id,
                                            }))}
                                            valeur={semaine?.id ?? ''}
                                        />
                                    </div>
                                    <Button
                                        aria-label="Semaine précédente"
                                        isDisabled={indexCourant >= semaines.length - 1}
                                        isIconOnly
                                        onPress={() =>
                                            choisirSemaine(semaines[indexCourant + 1]?.id ?? '')
                                        }
                                        variant="ghost"
                                    >
                                        <ChevronLeft aria-hidden="true" className="size-4" />
                                    </Button>
                                    <Button
                                        aria-label="Semaine suivante"
                                        isDisabled={indexCourant <= 0}
                                        isIconOnly
                                        onPress={() =>
                                            choisirSemaine(semaines[indexCourant - 1]?.id ?? '')
                                        }
                                        variant="ghost"
                                    >
                                        <ChevronRight aria-hidden="true" className="size-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card.Header>

                    <Card.Content className="gap-4">
                        {!semaine ? (
                            <EmptyState
                                subtitle="Aucune semaine de créneau n'est enregistrée pour ce coursier."
                                title="Aucun créneau"
                            />
                        ) : (
                            <>
                                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {formatSemaine(semaine.debut, semaine.fin)}
                                        </h3>
                                        <Chip size="sm" variant="soft">
                                            <Chip.Label>
                                                {semaine.semainePassee
                                                    ? 'Semaine terminée'
                                                    : 'Semaine en cours ou à venir'}
                                            </Chip.Label>
                                        </Chip>
                                    </div>
                                    {detailFourni && (
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
                                            <span>
                                                Jours planifiés{' '}
                                                <span className="font-medium tabular-nums text-foreground">
                                                    {joursPlanifies} / {lignes.length}
                                                </span>
                                            </span>
                                            <span>
                                                Total planifié{' '}
                                                <span className="font-medium tabular-nums text-foreground">
                                                    {formatDuree(totalMinutes)}
                                                </span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!detailFourni && (
                                    <p className="text-xs text-muted">
                                        Le détail des journées n&apos;a pas été transmis pour cette
                                        semaine : seules les dates du créneau sont connues.
                                    </p>
                                )}

                                <TableauResponsive
                                    cleLigne={(l) => l.cle}
                                    colonnes={colonnes}
                                    libelle={`Journées de la ${formatSemaine(semaine.debut, semaine.fin).toLowerCase()}`}
                                    lignes={lignes}
                                    vide="Aucune journée sur cette semaine"
                                />

                                <p className="text-xs text-muted">
                                    Rémunération complète sur les 7 jours de travail. Journée de 8
                                    heures minimum.
                                </p>
                            </>
                        )}
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <h2 className="text-base font-semibold text-foreground">Coursier</h2>
                    </Card.Header>
                    <Card.Content className="gap-3">
                        {/*
                          Le numero d'abord, et recopiable : c'est la seule valeur qu'on
                          emporte de cet ecran. Il etait jusqu'ici tronque au milieu d'une
                          liste, a selectionner a la souris.
                        */}
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted">Téléphone</span>
                            {telephone ? (
                                <ChampCopiable valeur={telephone} />
                            ) : (
                                <span className="text-sm text-default-400">{TIRET}</span>
                            )}
                        </div>
                        <div className="divide-y divide-separator">
                            <LigneCadre libelle="Assignation">
                                <Chip color={assignation.couleur} size="sm" variant="soft">
                                    <Chip.Label>{assignation.libelle}</Chip.Label>
                                </Chip>
                            </LigneCadre>
                            <LigneInfo libelle="E-mail" valeur={user?.email} />
                            <LigneInfo libelle="Adresse" valeur={user?.habitation} />
                            <LigneInfo libelle="Naissance" valeur={formatNaissance(user?.birthDay)} />
                            <LigneInfo
                                chiffres
                                libelle="Immatriculation"
                                valeur={user?.immatriculation}
                            />
                            <LigneInfo libelle="Ancienneté" valeur={exerianceLivreur} />
                            <LigneInfo
                                libelle="Premier créneau"
                                valeur={premierCreneau ? formatDateComplete(premierCreneau) : null}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted">Identifiant</span>
                            {identifiant ? (
                                <ChampCopiable valeur={identifiant} />
                            ) : (
                                <span className="text-sm text-default-400">{TIRET}</span>
                            )}
                        </div>
                    </Card.Content>
                </Card>
            </div>
        </div>
    );
}
