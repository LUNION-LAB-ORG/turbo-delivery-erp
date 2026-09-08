'use client';

import { Chip, Label, SearchField, Tabs, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Coins, TrendingUp, Wallet } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
import { TableauResponsive, type ColonneResponsive } from '@/components/commons/TableauResponsive';
import { useInvestissementList } from '@/features/revenus/hooks/use-investissement-list';
import { useRecouvrementList } from '@/features/revenus/hooks/use-recouvrement';
import { IRecouvrement } from '@/features/revenus/types/recouvrement/recouvrement.types';
import { IInvestissement } from '@/features/revenus/types/revenus.types';
import { formatMontant } from '@/utils/format.utils';

/**
 * L'historique des revenus encaissés : recouvrements et investissements.
 *
 * <h3>La forme de la donnée</h3>
 * <p>C'était une PILE DE CARTES, une par opération, chacune avec sa pastille ronde, son
 * icône, son badge et son montant posé à droite dans une graisse propre à la carte. Un
 * historique d'argent ne se lit pas ainsi : on l'ouvre pour retrouver une ligne, et pour
 * comparer des montants entre eux. Deux nombres qui ne tombent pas dans la même colonne
 * ne se comparent pas, et l'œil doit relire chaque chiffre. Ce sont des LIGNES : montants
 * en chasse tabulaire, alignés à droite, sous le même en-tête.</p>
 *
 * <p>Sur téléphone le tableau redevient des cartes, une fois, dans le composant partagé.</p>
 *
 * <h3>La couleur</h3>
 * <p>L'écran portait sept teintes fixes : bleu pour les recouvrements, vert pour les
 * investissements, violet pour le total et pour le PDG, rouge pour l'onglet actif, orange
 * pour l'échéance, et des dégradés pastel sur les trois cartes du bandeau. Aucune ne
 * disait rien : elles nommaient des CATÉGORIES. Le rouge de marque, lui, est réservé à ce
 * qui appelle un geste, et l'onglet actif d'un historique n'en appelle aucun. Aucune de
 * ces teintes n'avait de variante sombre.</p>
 *
 * <h3>Ce qui manquait</h3>
 * <p>Il n'y avait AUCUN état de chargement : pendant la lecture, l'écran affichait
 * « Aucun recouvrement trouvé », ce qui se lit comme un résultat vide. L'échec, lui,
 * remplaçait le bandeau entier des trois totaux, y compris ceux qui avaient été lus.
 * Chaque carte dit maintenant elle-même si sa source a répondu, et la relance reste
 * offerte sur une ligne au-dessus.</p>
 */

type Periode = 'annee' | 'aujourdhui' | 'mois' | 'semaine' | 'tous';

const PERIODES: readonly { cle: Periode; libelle: string }[] = [
    { cle: 'tous', libelle: 'Toutes les dates' },
    { cle: 'aujourdhui', libelle: "Aujourd'hui" },
    { cle: 'semaine', libelle: 'Cette semaine' },
    { cle: 'mois', libelle: 'Ce mois' },
    { cle: 'annee', libelle: 'Cette année' },
];

/**
 * Les deux bornes de la periode choisie, ou `null` quand on ne filtre pas.
 *
 * <p>Le calcul etait ecrit DEUX FOIS, mot pour mot, une fois par jeu de donnees : le meme
 * `switch` de trente lignes sur les recouvrements et sur les investissements. Deux copies
 * qui divergent des qu'on touche a l'une.</p>
 */
function bornesPeriode(periode: Periode): { debut: Date; fin: Date } | null {
    if (periode === 'tous') return null;

    const jour = new Date();
    jour.setHours(0, 0, 0, 0);

    if (periode === 'aujourdhui') {
        const fin = new Date(jour);
        fin.setHours(23, 59, 59, 999);
        return { debut: jour, fin };
    }

    if (periode === 'semaine') {
        // La semaine francaise commence le LUNDI. L'ancien calcul retranchait `getDay()`,
        // donc partait du dimanche : le dimanche courant tombait hors de « cette semaine »
        // et celui de la semaine passee y entrait.
        const decalage = (jour.getDay() + 6) % 7;
        const debut = new Date(jour);
        debut.setDate(jour.getDate() - decalage);
        const fin = new Date(debut);
        fin.setDate(debut.getDate() + 6);
        fin.setHours(23, 59, 59, 999);
        return { debut, fin };
    }

    if (periode === 'mois') {
        return {
            debut: new Date(jour.getFullYear(), jour.getMonth(), 1),
            fin: new Date(jour.getFullYear(), jour.getMonth() + 1, 0, 23, 59, 59, 999),
        };
    }

    return {
        debut: new Date(jour.getFullYear(), 0, 1),
        fin: new Date(jour.getFullYear(), 11, 31, 23, 59, 59, 999),
    };
}

/**
 * Une ligne SANS date reste visible quelle que soit la periode.
 *
 * <p>C'est le comportement d'origine, et il est le bon : masquer une operation parce
 * qu'il lui manque une date, c'est retirer de l'ecran precisement celle qu'il faut aller
 * corriger.</p>
 */
function dansLaPeriode(iso: string | undefined, bornes: { debut: Date; fin: Date } | null): boolean {
    if (!bornes || !iso) return true;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return true;
    return date >= bornes.debut && date <= bornes.fin;
}

function contient(valeur: string | undefined, recherche: string): boolean {
    return Boolean(valeur && valeur.toLowerCase().includes(recherche));
}

function formatDate(iso: string | undefined): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'dd MMM yyyy', { locale: fr });
}

/*
 * La direction se reconnait au NOM de l'investisseur, faute de champ dedie dans la charge
 * utile. C'est une heuristique : elle sert a remonter ces lignes en tete de liste, jamais
 * a peindre la ligne d'une couleur qui laisserait croire a un etat verifie.
 */
const MOTS_DIRECTION = ['pdg', 'président', 'directeur général'];

function estDirection(nom: string | undefined): boolean {
    const bas = (nom ?? '').toLowerCase();
    return MOTS_DIRECTION.some((mot) => bas.includes(mot));
}

/** Le nom, avec la référence de l'opération dessous. */
function Identite({ reference, titre }: { reference: string; titre: ReactNode }) {
    return (
        <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                {titre}
            </div>
            {/*
             * La reference etait CHERCHABLE et nulle part affichee : le champ de recherche
             * annoncait « par reference » alors que la ligne mise en commentaire etait la
             * seule a la porter. On cherchait donc une valeur qu'on ne pouvait pas lire.
             */}
            <p className="truncate font-mono text-[11px] leading-tight text-muted">{reference}</p>
        </div>
    );
}

export default function RevenusEncaissesClient() {
    const [onglet, setOnglet] = useState('recouvrements');
    const [recherche, setRecherche] = useState('');
    const [periode, setPeriode] = useState<Periode>('tous');

    const {
        isError: isErrorRecouvrements,
        isFetching: isFetchingRecouvrements,
        isLoading: isLoadingRecouvrements,
        recouvrement: recouvrementsData,
        refetch: refetchRecouvrements,
        total: totalTransactions,
    } = useRecouvrementList({ initialData: [] });

    const {
        investissements,
        isError: isErrorInvestissements,
        isFetching: isFetchingInvestissements,
        isLoading: isLoadingInvestissements,
        refetch: refetchInvestissements,
    } = useInvestissementList();

    const recouvrements: IRecouvrement[] = useMemo(
        () => (Array.isArray(recouvrementsData) ? recouvrementsData : []),
        [recouvrementsData],
    );
    const apports: IInvestissement[] = useMemo(
        () => (Array.isArray(investissements) ? investissements : []),
        [investissements],
    );

    // Les totaux portent sur TOUT ce qui a ete lu, pas sur ce que les filtres laissent
    // voir : c'est le stock encaisse, et il ne bouge pas quand on cherche une ligne.
    const totalRecouvrements = recouvrements.reduce((somme, r) => somme + (r.montant || 0), 0);
    const totalInvestissements = apports.reduce((somme, i) => somme + (i.montant || 0), 0);
    const totalGeneral = totalRecouvrements + totalInvestissements;
    const enEchec = isErrorRecouvrements || isErrorInvestissements;

    /*
     * Le total SERVEUR n'est lisible que si la reponse est paginee : `useRecouvrementList`
     * le prend dans `totalElements`, absent quand l'API rend un tableau nu, et retombe
     * alors a zero. « 0 transactions » sous un montant non nul se lirait comme un defaut
     * d'application ; on annonce dans ce cas ce qu'on a reellement lu.
     */
    const noteRecouvrements =
        totalTransactions >= recouvrements.length
            ? `${totalTransactions} transactions enregistrées`
            : `${recouvrements.length} transactions lues`;

    const bornes = useMemo(() => bornesPeriode(periode), [periode]);
    const cherche = recherche.trim().toLowerCase();

    const recouvrementsFiltres = useMemo(
        () =>
            recouvrements.filter(
                (r) =>
                    (!cherche || contient(r.id, cherche) || contient(r.nomRestaurant, cherche)) &&
                    dansLaPeriode(r.dateRecouvrement, bornes),
            ),
        [bornes, cherche, recouvrements],
    );

    const apportsFiltres = useMemo(() => {
        const retenus = apports.filter(
            (i) =>
                (!cherche || contient(i.id, cherche) || contient(i.nomInvestisseur, cherche)) &&
                dansLaPeriode(i.dateInvestissement, bornes),
        );

        // La direction en tete, puis du plus recent au plus ancien.
        return [...retenus].sort((a, b) => {
            const directionA = estDirection(a.nomInvestisseur);
            const directionB = estDirection(b.nomInvestisseur);
            if (directionA !== directionB) return directionA ? -1 : 1;
            return (
                new Date(b.dateInvestissement || 0).getTime() -
                new Date(a.dateInvestissement || 0).getTime()
            );
        });
    }, [apports, bornes, cherche]);

    const colonnesRecouvrements: ColonneResponsive<IRecouvrement>[] = [
        {
            cle: 'restaurant',
            identite: true,
            libelle: 'Restaurant',
            rendu: (r) => (
                <Identite
                    reference={r.id}
                    titre={<span className="truncate">{r.nomRestaurant || 'Restaurant inconnu'}</span>}
                />
            ),
        },
        {
            cle: 'date',
            libelle: 'Date de recouvrement',
            rendu: (r) => <span className="text-sm">{formatDate(r.dateRecouvrement)}</span>,
        },
        {
            cle: 'montant',
            libelle: 'Montant',
            nombre: true,
            rendu: (r) => <span className="font-medium">{formatMontant(r.montant ?? 0)}</span>,
        },
    ];

    const colonnesApports: ColonneResponsive<IInvestissement>[] = [
        {
            cle: 'investisseur',
            identite: true,
            libelle: 'Investisseur',
            rendu: (i) => (
                <Identite
                    reference={i.id}
                    titre={
                        <>
                            <span className="truncate">{i.nomInvestisseur || 'Investisseur inconnu'}</span>
                            {estDirection(i.nomInvestisseur) && (
                                <Chip className="shrink-0" size="sm" variant="soft">
                                    Direction
                                </Chip>
                            )}
                        </>
                    }
                />
            ),
        },
        {
            cle: 'date',
            libelle: "Date de l'apport",
            rendu: (i) => <span className="text-sm">{formatDate(i.dateInvestissement)}</span>,
        },
        {
            cle: 'echeance',
            libelle: 'Échéance',
            rendu: (i) => <span className="text-sm">{formatDate(i.deadline)}</span>,
        },
        {
            cle: 'montant',
            libelle: 'Montant',
            nombre: true,
            rendu: (i) => <span className="font-medium">{formatMontant(i.montant ?? 0)}</span>,
        },
    ];

    return (
        <div className="flex flex-col gap-5 p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h1 className="text-xl font-semibold text-foreground md:text-2xl">
                    Historique des revenus encaissés
                </h1>

                {/*
                 * Deux NAVIGATIONS, pas deux gestes : c'etaient des `Button` peints en bleu
                 * et en vert qui posaient `window.location.href`, donc un rechargement
                 * complet de l'application, sans ctrl-clic ni ouverture dans un onglet.
                 */}
                <div className="flex flex-wrap items-center gap-2">
                    <LienBouton href="/finance/recouvrement" taille="sm" variante="outline">
                        <Wallet aria-hidden="true" className="size-4" />
                        Gestion des recouvrements
                    </LienBouton>
                    <LienBouton href="/finance/revenue/investissement" taille="sm" variante="outline">
                        <TrendingUp aria-hidden="true" className="size-4" />
                        Gestion des investissements
                    </LienBouton>
                </div>
            </div>

            {enEchec && (
                <EtatErreur
                    compact
                    enCours={isFetchingRecouvrements || isFetchingInvestissements}
                    onReessayer={() => {
                        if (isErrorRecouvrements) refetchRecouvrements();
                        if (isErrorInvestissements) refetchInvestissements();
                    }}
                    quoi={
                        isErrorRecouvrements && isErrorInvestissements
                            ? 'les revenus encaissés'
                            : isErrorRecouvrements
                              ? 'les recouvrements'
                              : 'les investissements'
                    }
                />
            )}

            {/* `md:` et non `lg:` : la fenetre des postes fait 1000 px et n'ouvre jamais `lg`. */}
            <GrilleStats className="md:grid-cols-3" colonnes={3}>
                <CarteStat
                    icone={Wallet}
                    isError={isErrorRecouvrements}
                    isLoading={isLoadingRecouvrements}
                    libelle="Recouvrements"
                    note={noteRecouvrements}
                    valeur={formatMontant(totalRecouvrements)}
                />
                <CarteStat
                    icone={TrendingUp}
                    isError={isErrorInvestissements}
                    isLoading={isLoadingInvestissements}
                    libelle="Investissements"
                    note={`${apports.length} apports lus`}
                    valeur={formatMontant(totalInvestissements)}
                />
                {/*
                 * La seule carte mise en avant du bandeau : c'est la somme des deux autres,
                 * pas une troisieme categorie. Un tiret si l'une des deux sources manque,
                 * car un total ampute se lit comme une baisse.
                 */}
                <CarteStat
                    accent
                    icone={Coins}
                    isError={enEchec}
                    isLoading={isLoadingRecouvrements || isLoadingInvestissements}
                    libelle="Total général"
                    note={`${recouvrements.length + apports.length} opérations`}
                    valeur={formatMontant(totalGeneral)}
                />
            </GrilleStats>

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <SearchField
                    className="w-full md:max-w-sm"
                    onChange={setRecherche}
                    value={recherche}
                >
                    <Label>Recherche</Label>
                    <SearchField.Group>
                        <SearchField.SearchIcon />
                        <SearchField.Input placeholder="Restaurant, investisseur ou référence…" />
                        <SearchField.ClearButton />
                    </SearchField.Group>
                </SearchField>

                {/*
                 * La periode etait une liste deroulante : il fallait l'ouvrir pour savoir
                 * ce qui etait filtre. Cinq choix tiennent sur une ligne, et le choix actif
                 * se voit sans un clic.
                 */}
                <ToggleButtonGroup
                    className="flex-wrap"
                    onSelectionChange={(cles) => {
                        const premiere = [...cles][0];
                        if (premiere) setPeriode(premiere as Periode);
                    }}
                    selectedKeys={new Set([periode])}
                    selectionMode="single"
                >
                    {PERIODES.map((p) => (
                        <ToggleButton id={p.cle} key={p.cle} size="sm">
                            {p.libelle}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </div>

            {/* Pas de `Tabs.Indicator` : il leve hors d'un conteneur d'animation et fait
                tomber la page entiere. */}
            <Tabs
                className="w-full"
                onSelectionChange={(cle) => setOnglet(String(cle))}
                selectedKey={onglet}
            >
                <Tabs.List className="overflow-x-auto">
                    <Tabs.Tab id="recouvrements">{`Recouvrements (${recouvrementsFiltres.length})`}</Tabs.Tab>
                    <Tabs.Tab id="investissements">{`Investissements (${apportsFiltres.length})`}</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel className="pt-4" id="recouvrements">
                    <TableauResponsive
                        cleLigne={(r) => r.id || `recouvrement-${recouvrementsFiltres.indexOf(r)}`}
                        colonnes={colonnesRecouvrements}
                        enChargement={isLoadingRecouvrements}
                        enCoursDeRelance={isFetchingRecouvrements}
                        erreur={isErrorRecouvrements}
                        libelle="Recouvrements encaissés"
                        lignes={recouvrementsFiltres}
                        onReessayer={() => refetchRecouvrements()}
                        quoi="les recouvrements"
                        vide={
                            cherche || periode !== 'tous'
                                ? 'Aucun recouvrement pour ces critères.'
                                : 'Aucun recouvrement enregistré.'
                        }
                    />
                </Tabs.Panel>

                <Tabs.Panel className="pt-4" id="investissements">
                    <TableauResponsive
                        cleLigne={(i) => i.id || `apport-${apportsFiltres.indexOf(i)}`}
                        colonnes={colonnesApports}
                        enChargement={isLoadingInvestissements}
                        enCoursDeRelance={isFetchingInvestissements}
                        erreur={isErrorInvestissements}
                        libelle="Investissements reçus"
                        lignes={apportsFiltres}
                        onReessayer={() => refetchInvestissements()}
                        quoi="les investissements"
                        vide={
                            cherche || periode !== 'tous'
                                ? 'Aucun investissement pour ces critères.'
                                : 'Aucun investissement enregistré.'
                        }
                    />
                </Tabs.Panel>
            </Tabs>
        </div>
    );
}
