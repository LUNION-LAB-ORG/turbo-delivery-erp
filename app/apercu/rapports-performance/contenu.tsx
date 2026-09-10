'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { ChartsSection } from '@/features/rapports-performance/components/charts-section';
import { DetailParStoreSection } from '@/features/rapports-performance/components/detail-par-store/detail-par-store-section';
import { FinancialDetailsSection } from '@/features/rapports-performance/components/financial-details-section';
import { MiddleStatsSection } from '@/features/rapports-performance/components/middle-stats-section';
import { PerformanceHeader } from '@/features/rapports-performance/components/performance-header';
import { PerformanceSummarySection } from '@/features/rapports-performance/components/performance-summary-section';
import type { OptionGroupe } from '@/features/rapports-performance/components/selecteur-groupe';
import { SelecteurSelection } from '@/features/rapports-performance/components/selecteur-selection';
import { TopStatsSection } from '@/features/rapports-performance/components/top-stats-section';
import type { ModeSelection } from '@/features/rapports-performance/filters/performance.filters';
import type {
    IDashboardData,
    IGeographicLocation,
    ISelectionAnalytics,
    IStorePerformance,
    IWeeklyActivity,
} from '@/features/rapports-performance/types/performance.type';
import { decrireSelection } from '@/features/rapports-performance/utils/selection.utils';
import type { RestaurantOption } from '@/features/restaurants';

/**
 * Le banc du RAPPORT DE PERFORMANCE.
 *
 * <p>Il monte les VRAIS composants du rapport - entete, selecteur a trois modes, bandeau de
 * tete, les deux graphiques, bandeau du milieu, detail financier, detail par store, resume -
 * sur des donnees d'exemple. Seule la lecture reseau est remplacee. Un banc qui remonterait
 * la page a sa facon ne montrerait pas l'ecran, il montrerait le banc.</p>
 *
 * <p>Il existe pour une raison precise : ce module portait trente-sept couleurs ecrites en
 * dur, dont une grille de graphique a `#f3f4f6` et une infobulle a fond blanc, invisibles
 * ou aveuglantes en theme sombre. Rien de tout cela ne se voit sans regarder l'ecran dans
 * les deux themes, et ces ecrans vivent derriere `app/(protected)/`, donc derriere une
 * session. Le bouton « sombre » de la barre du haut est le seul moyen honnete de verifier.</p>
 *
 * <p>Il porte desormais les quatre cas de selection multiple que la production peut rendre,
 * et qu'aucune session d'essai ne produit a la demande : un cumul de plusieurs partenaires,
 * un groupe reel, un groupe REEL MAIS VIDE et un groupe INCONNU. Les deux derniers se
 * distinguent par `groupeNom` seul et donnent deux messages differents - c'est exactement
 * le genre d'ecart qu'on ne voit pas sans un banc.</p>
 *
 * <p>La barre du haut n'appartient PAS a l'ecran. Tout ce qui est sous elle, si.</p>
 *
 * <p>La largeur se bascule a 1000 px, la fenetre reelle des postes, parce que c'est la
 * seule largeur ou l'on voit ce que voit l'operateur : le seuil `lg` de Tailwind (1024 px)
 * ne s'y ouvre jamais.</p>
 */

const ZONES = [
    'MARCORY',
    'ZONE 4 | BIÉTRY',
    'PLATEAU',
    'COCODY | RIVIERA',
    'YOPOUGON',
    'TREICHVILLE',
    'ABOBO',
    'KOUMASSI',
    'ADJAMÉ',
    'BINGERVILLE',
];

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/**
 * Les partenaires du banc, avec des identifiants stables.
 *
 * <p>Ce sont les noms reels de la production : ils ont des longueurs tres inegales, et
 * c'est precisement ce qui fait deborder une colonne « Etablissement » calibree sur un nom
 * court.</p>
 */
const PARTENAIRES: RestaurantOption[] = [
    { label: 'AGHA ZONE 4', value: 'c063c838-fbf0-423a-9de7-1ee206e45a50' },
    { label: 'COMANCHE DINER', value: 'fcb0b302-1af6-4686-aceb-a59ac728704a' },
    { label: 'LE PETIT CAFE', value: '45033446-4446-45fc-b08e-63d036e4cde5' },
    { label: 'PHO HONG', value: 'c922c0c3-ac7d-4a12-ba3f-6d4caeaee7ef' },
    { label: 'PLATO', value: 'd7267f2e-0837-409d-bb29-a5ebe8f5c8ed' },
    { label: 'TAYBA ZONE 4', value: 'd79086b8-4075-4cf9-9481-3b73c1ea5b55' },
];

const GROUPES: OptionGroupe[] = [
    { id: 'g-agha', nbEtablissements: 3, nom: 'AGHA' },
    { id: 'g-vide', nbEtablissements: 0, nom: 'NOUVEAU GROUPE' },
];

const GROUPE_DISSOUS = '00000000-0000-0000-0000-000000000000';

/** Reproductible : deux rendus doivent montrer la meme chose. */
function alea(graine: number) {
    let e = graine;
    return () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
}

/**
 * Les zones, TRIEES par livraisons decroissantes et avec `value` en POURCENTAGE.
 *
 * <p>C'est exactement ce que rend le serveur : `AnalyticsRepository.getGeographic` groupe par
 * zone, calcule `value` comme une part du total arrondie a l'entier, trie par livraisons
 * decroissantes et borne a dix lignes. Un banc qui inventerait un autre contrat ne
 * verifierait rien - en particulier pas la gradation du camembert, qui dit le RANG.</p>
 */
function fabriquerZones(graine: number, nbZones: number): IGeographicLocation[] {
    const suivant = alea(graine);
    const brutes = ZONES.slice(0, nbZones).map((name) => ({
        name,
        deliveries: 4 + Math.round(suivant() * 140),
    }));
    brutes.sort((a, b) => b.deliveries - a.deliveries);
    const total = brutes.reduce((n, z) => n + z.deliveries, 0);

    return brutes.map((z) => ({
        color: '',
        deliveries: z.deliveries,
        name: z.name,
        value: total > 0 ? Math.round((z.deliveries * 100) / total) : 0,
    }));
}

function fabriquerSemaine(graine: number): IWeeklyActivity[] {
    const suivant = alea(graine);

    return JOURS.map((day) => {
        const deliveries = 1 + Math.round(suivant() * 18);
        return { day, deliveries, revenue: deliveries * (7500 + Math.round(suivant() * 6000)) };
    });
}

/** La selection d'un rapport unitaire : `parStore` est NUL, il n'y a rien a detailler. */
function selectionUnitaire(restaurantId: string): ISelectionAnalytics {
    return {
        groupeId: null,
        groupeNom: null,
        mode: 'UNITAIRE',
        parametresIgnores: [],
        restaurantId,
        restaurantIds: [],
    };
}

function fabriquer(graine: number, nbZones: number): IDashboardData {
    const suivant = alea(graine);
    const zones = fabriquerZones(graine, nbZones);
    const semaine = fabriquerSemaine(graine + 7);
    const totalDeliveries = zones.reduce((n, z) => n + z.deliveries, 0);
    const totalOrderAmount = semaine.reduce((n, j) => n + j.revenue, 0) * 4;
    const deliveryFeesCollected = Math.round(totalDeliveries * 1500);
    const turboDeliveryServiceFees = Math.round(totalOrderAmount * 0.08);

    return {
        financialDetails: {
            deliveryFeesCollected,
            totalFacture: deliveryFeesCollected + turboDeliveryServiceFees,
            totalOrderAmount,
            turboDeliveryServiceFees,
        },
        geographicData: zones,
        mainKPIs: {
            chiffreAffaires: deliveryFeesCollected + turboDeliveryServiceFees,
            successRate: 82 + suivant() * 16,
            totalDeliveries,
            totalOrderValue: totalOrderAmount,
        },
        // En unitaire, le serveur rend NULL - et non un tableau vide, qui se lirait
        // « aucun store ». Le bloc de detail ne doit pas apparaitre sur ces jeux.
        parStore: null,
        secondaryKPIs: {
            // Les deux valeurs que la production ne mesure pas : la page doit rendre un
            // tiret, jamais « 0 min » ni « 1 article ». Le banc les laisse donc a zero.
            averageDeliveryTime: 0,
            averageItemsPerOrder: 0,
            monthlyGrowth: -4 + suivant() * 28,
        },
        selection: selectionUnitaire(PARTENAIRES[4].value),
        weeklyActivity: semaine,
    };
}

/**
 * Ce qu'un etablissement pese dans un cumul, AVANT mise en forme.
 *
 * <p>`terminees` et `conclues` sont conservees separement a dessein : le taux de succes de
 * tete est `somme(terminees) / somme(conclues)`, PAS la moyenne des taux par ligne. Sans
 * ces deux compteurs, le banc afficherait une moyenne de moyennes et le seul point ou les
 * lignes ne somment pas le total passerait inapercu.</p>
 */
interface PoidsStore {
    option: RestaurantOption;
    terminees: number;
    conclues: number;
    panier: number;
    frais: number;
    commission: number;
}

/**
 * Un rapport CONSOLIDE, dont les totaux de tete sont EXACTEMENT la somme des lignes.
 *
 * <p>C'est la propriete que la production garantit, verifiee au franc pres, et c'est la
 * seule chose que ce bloc doit permettre de verifier a l'ecran : la ligne de total du
 * tableau doit retomber sur les cartes de tete et sur le detail financier. Un banc dont les
 * chiffres seraient tires au sort separement ne verifierait rien.</p>
 */
function fabriquerConsolide(
    graine: number,
    poids: PoidsStore[],
    selection: ISelectionAnalytics,
): IDashboardData {
    const suivant = alea(graine);
    const zones = fabriquerZones(graine, 6);
    const semaine = fabriquerSemaine(graine + 7);

    const parStore: IStorePerformance[] = poids.map((p) => ({
        deliveryFeesCollected: p.frais,
        nom: p.option.label,
        restaurantId: p.option.value,
        // ⚠ Un etablissement SANS AUCUNE COURSE CONCLUE n'a pas de taux : le serveur rend
        // `null`, et la cellule doit afficher un tiret, jamais « 0.0 % ».
        successRate: p.conclues > 0 ? (p.terminees * 100) / p.conclues : null,
        totalDeliveries: p.terminees,
        totalFacture: p.frais + p.commission,
        totalOrderValue: p.panier,
        turboDeliveryServiceFees: p.commission,
    }));

    const somme = (lire: (l: IStorePerformance) => number) =>
        parStore.reduce((n, l) => n + lire(l), 0);

    const totalDeliveries = somme((l) => l.totalDeliveries);
    const totalOrderValue = somme((l) => l.totalOrderValue);
    const deliveryFeesCollected = somme((l) => l.deliveryFeesCollected);
    const turboDeliveryServiceFees = somme((l) => l.turboDeliveryServiceFees);
    const totalFacture = somme((l) => l.totalFacture);

    const conclues = poids.reduce((n, p) => n + p.conclues, 0);
    const terminees = poids.reduce((n, p) => n + p.terminees, 0);

    return {
        financialDetails: {
            deliveryFeesCollected,
            totalFacture,
            totalOrderAmount: totalOrderValue,
            turboDeliveryServiceFees,
        },
        geographicData: zones,
        mainKPIs: {
            chiffreAffaires: totalFacture,
            successRate: conclues > 0 ? (terminees * 100) / conclues : null,
            totalDeliveries,
            totalOrderValue,
        },
        parStore,
        secondaryKPIs: {
            averageDeliveryTime: null,
            averageItemsPerOrder: null,
            monthlyGrowth: -4 + suivant() * 28,
        },
        selection,
        weeklyActivity: semaine,
    };
}

/**
 * Les quatre etablissements du jeu MULTI.
 *
 * <p>Ils sont volontairement DESEQUILIBRES, comme la production : sur avril 2026, trois
 * partenaires cumulent 8 869 livraisons dont 8 455 pour un seul. Le dernier n'a AUCUNE
 * course sur la periode et figure tout de meme, a zero : c'est le contrat du bloc, une
 * ligne par etablissement de la selection, y compris ceux sans commande.</p>
 */
const POIDS_MULTI: PoidsStore[] = [
    { commission: 1488200, conclues: 8455, frais: 12610500, option: PARTENAIRES[0], panier: 106608501, terminees: 8455 },
    { commission: 5500, conclues: 287, frais: 371000, option: PARTENAIRES[5], panier: 3587650, terminees: 270 },
    { commission: 0, conclues: 158, frais: 218500, option: PARTENAIRES[2], panier: 1158500, terminees: 144 },
    // Sans une seule course conclue : zero partout, et un TIRET dans la colonne du taux.
    { commission: 0, conclues: 0, frais: 0, option: PARTENAIRES[3], panier: 0, terminees: 0 },
];

const POIDS_GROUPE: PoidsStore[] = [
    { commission: 1488200, conclues: 8455, frais: 12610500, option: PARTENAIRES[0], panier: 106608501, terminees: 8455 },
    { commission: 92400, conclues: 1204, frais: 1683000, option: PARTENAIRES[1], panier: 14238900, terminees: 1121 },
    { commission: 5500, conclues: 287, frais: 371000, option: PARTENAIRES[5], panier: 3587650, terminees: 270 },
];

/** Un cumul qui ne porte sur RIEN : toutes les grandeurs a zero, aucune ligne. */
function fabriquerCumulVide(selection: ISelectionAnalytics): IDashboardData {
    return {
        financialDetails: {
            deliveryFeesCollected: 0,
            totalFacture: 0,
            totalOrderAmount: 0,
            turboDeliveryServiceFees: 0,
        },
        geographicData: [],
        mainKPIs: { chiffreAffaires: 0, successRate: null, totalDeliveries: 0, totalOrderValue: 0 },
        // ⚠ VIDE, et non NUL : le bloc s'affiche et DIT pourquoi il n'a rien a montrer.
        parStore: [],
        secondaryKPIs: { averageDeliveryTime: null, averageItemsPerOrder: null, monthlyGrowth: null },
        selection,
        weeklyActivity: [],
    };
}

/**
 * Le rapport d'une periode SANS AUCUNE COURSE.
 *
 * <p>C'est l'etat par defaut de toute nouvelle enseigne, et celui d'un mois qui vient de
 * commencer. Rien n'est tire au sort : pas une zone, pas un jour. Le camembert n'a donc pas
 * une seule part, le graphe hebdomadaire pas une seule barre, et « Zone Top » n'a personne
 * a nommer. `successRate` vaut `null` : aucune course conclue, le taux n'existe pas.</p>
 */
const VIDE: IDashboardData = {
    financialDetails: {
        deliveryFeesCollected: 0,
        totalFacture: 0,
        totalOrderAmount: 0,
        turboDeliveryServiceFees: 0,
    },
    geographicData: [],
    mainKPIs: { chiffreAffaires: 0, successRate: null, totalDeliveries: 0, totalOrderValue: 0 },
    parStore: null,
    // Un banc qui n'envoie pas ce que le serveur envoie ne verifie rien. Sur une periode
    // sans course, la production rend `null` pour les trois : `calculateGrowth` sort en
    // `null` quand le mois precedent est vide, et les deux moyennes ne sont pas mesurees.
    // Un zero ferait afficher « 0 min », « 0.0% » et « 0 », soit trois faits inventes,
    // exactement ce que ce lot retire de l'ecran reel.
    secondaryKPIs: { averageDeliveryTime: null, averageItemsPerOrder: null, monthlyGrowth: null },
    selection: selectionUnitaire(PARTENAIRES[4].value),
    weeklyActivity: [],
};

/**
 * Des livraisons, mais AUCUN taux.
 *
 * <p>`successRate` a `null` avec de la donnee partout ailleurs : le tiret de la carte de
 * tete et la phrase du resume qui s'arrete avant « avec un taux de succes de » se
 * verifient sur cet ecran-la, pas sur celui qui est vide de bout en bout. C'est le cas qui
 * faisait tomber le resume ENTIER quand il appelait `toFixed` sur un `null`.</p>
 */
function sansTaux(base: IDashboardData): IDashboardData {
    return { ...base, mainKPIs: { ...base.mainKPIs, successRate: null } };
}

const JEUX = {
    ordinaire: { donnees: fabriquer(11, 6), libelle: 'Rapport ordinaire' },
    dixZones: { donnees: fabriquer(37, ZONES.length), libelle: 'Dix zones' },
    uneZone: { donnees: fabriquer(23, 1), libelle: 'Une seule zone' },
    sansTaux: { donnees: sansTaux(fabriquer(11, 6)), libelle: 'Taux non mesuré' },
    vide: { donnees: VIDE, libelle: 'Aucune course' },
    multi: {
        donnees: fabriquerConsolide(53, POIDS_MULTI, {
            groupeId: null,
            groupeNom: null,
            mode: 'MULTI',
            parametresIgnores: [],
            restaurantId: null,
            restaurantIds: POIDS_MULTI.map((p) => p.option.value),
        }),
        libelle: '4 partenaires',
    },
    groupe: {
        donnees: fabriquerConsolide(61, POIDS_GROUPE, {
            groupeId: 'g-agha',
            groupeNom: 'AGHA',
            mode: 'GROUPE',
            parametresIgnores: [],
            restaurantId: null,
            restaurantIds: POIDS_GROUPE.map((p) => p.option.value),
        }),
        libelle: 'Groupe AGHA',
    },
    /*
     * ⚠ Groupe REEL mais VIDE : `groupeNom` est renseigne, `restaurantIds` est vide. Le
     * groupe existe, il ne contient simplement aucun etablissement.
     */
    groupeVide: {
        donnees: fabriquerCumulVide({
            groupeId: 'g-vide',
            groupeNom: 'NOUVEAU GROUPE',
            mode: 'GROUPE',
            parametresIgnores: [],
            restaurantId: null,
            restaurantIds: [],
        }),
        libelle: 'Groupe vide',
    },
    /*
     * ⚠ Groupe INCONNU : `groupeNom` est NUL avec `restaurantIds` vide. C'est le seul
     * signal qui distingue ce cas du precedent, et les deux messages ne sont pas les memes -
     * l'un se repare en rattachant des etablissements, l'autre en changeant de lien.
     */
    groupeInconnu: {
        donnees: fabriquerCumulVide({
            groupeId: GROUPE_DISSOUS,
            groupeNom: null,
            mode: 'GROUPE',
            parametresIgnores: ['restaurantId'],
            restaurantId: null,
            restaurantIds: [],
        }),
        libelle: 'Groupe inconnu',
    },
};

/**
 * Bascule le theme sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` declare encore les jetons shadcn
 * en triplets HSL bruts dans la meme portee `.dark` que HeroUI, et sur un div imbrique
 * c'est le triplet qui gagne - `bg-success` ne peint alors plus rien.</p>
 */
function useThemeSombre(): [boolean, (v: (p: boolean) => boolean) => void] {
    const [sombre, setSombre] = React.useState(false);
    React.useEffect(() => {
        const html = document.documentElement;
        const avant = html.className;
        html.className = sombre ? 'dark' : 'light';
        return () => {
            html.className = avant;
        };
    }, [sombre]);
    return [sombre, setSombre];
}

/*
 * Des bornes FIGEES, et non `startOfMonth(new Date())` : la carte des livraisons divise par
 * les jours ecoules de la periode, donc un banc dont la periode bouge avec l'horloge rend
 * une moyenne differente a chaque ouverture, et rien n'est plus comparable d'un jour sur
 * l'autre.
 */
const DEBUT = new Date(2026, 8, 1);
const FIN = new Date(2026, 8, 30);

export default function ApercuRapportsPerformance() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [sombre, setSombre] = useThemeSombre();
    const [posteReel, setPosteReel] = React.useState(true);
    const [enChargement, setEnChargement] = React.useState(false);
    /*
     * L'echec de lecture de la liste des groupes est un ETAT DE PRODUCTION, pas un incident :
     * l'endpoint est reserve a la Direction, aux administrateurs et aux Ops Managers, donc
     * un compte Finance recoit un 403 a chaque fois. Le banc le bascule a la main.
     */
    const [groupesEnErreur, setGroupesEnErreur] = React.useState(false);
    const donnees = JEUX[jeu].donnees;

    // Le banc n'a pas d'URL a tenir : les memes valeurs, en etat local. Elles suivent le jeu
    // choisi, pour que le selecteur montre la selection que les donnees decrivent.
    const [mode, setMode] = React.useState<ModeSelection>('UNITAIRE');
    const [restaurantId, setRestaurantId] = React.useState<string | undefined>(PARTENAIRES[4].value);
    const [restaurantIds, setRestaurantIds] = React.useState<string[]>([]);
    const [groupeId, setGroupeId] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        const s = donnees.selection;
        if (!s) return;
        if (s.mode === 'GROUPE') {
            setMode('GROUPE');
            setGroupeId(s.groupeId ?? undefined);
            return;
        }
        if (s.mode === 'MULTI') {
            setMode('MULTI');
            setRestaurantIds(s.restaurantIds);
            return;
        }
        setMode('UNITAIRE');
        setRestaurantId(s.restaurantId ?? undefined);
    }, [donnees]);

    /*
     * Le MEME calcul que l'ecran reel : l'en-tete, le detail financier, le detail par store
     * et le resume tirent tous leur libelle d'ici. Le banc verifie donc la phrase, son
     * accord et le message d'avertissement, pas seulement les couleurs.
     */
    const selection = decrireSelection(
        donnees.selection,
        { groupeId: groupeId ?? '', mode, restaurantId: restaurantId ?? '', restaurantIds },
        {
            nomGroupe: (id) => GROUPES.find((g) => g.id === id)?.nom,
            nomRestaurant: (id) => PARTENAIRES.find((p) => p.value === id)?.label,
        },
    );

    const parStore = donnees.parStore ?? null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                <span className="font-bold uppercase tracking-wider">Aperçu · Rapport de performance</span>
                {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                    <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                        {JEUX[k].libelle}
                    </Button>
                ))}
                <Button
                    className="ms-auto"
                    onPress={() => setGroupesEnErreur((v) => !v)}
                    size="sm"
                    variant="outline"
                >
                    {groupesEnErreur ? 'groupes illisibles' : 'groupes lisibles'}
                </Button>
                <Button onPress={() => setEnChargement((v) => !v)} size="sm" variant="outline">
                    {enChargement ? 'en chargement' : 'chargé'}
                </Button>
                <Button onPress={() => setPosteReel((v) => !v)} size="sm" variant="outline">
                    {posteReel ? 'fenêtre 1000 px' : 'pleine largeur'}
                </Button>
                <Button onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                    {sombre ? 'sombre' : 'clair'}
                </Button>
            </header>

            <div className="mx-auto" style={{ maxWidth: posteReel ? 1000 : 1500 }}>
                {/* Le meme habillage que `PerformanceReport`, a la classe pres. */}
                <div className="bg-surface-secondary p-6">
                    <PerformanceHeader
                        avertissement={selection.avertissement}
                        debut={DEBUT}
                        fin={FIN}
                        libelleSelection={selection.libelle}
                        // Le banc n'exporte rien : le bouton est la pour etre REGARDE, a sa
                        // taille et a sa couleur reelles, pas pour ecrire un PDF.
                        onDateChange={() => undefined}
                        onExportPdf={() => undefined}
                        selecteur={
                            <SelecteurSelection
                                groupeId={groupeId}
                                groupes={groupesEnErreur ? [] : GROUPES}
                                groupesEnErreur={groupesEnErreur}
                                mode={mode}
                                onGroupeChange={setGroupeId}
                                onModeChange={setMode}
                                onRestaurantChange={setRestaurantId}
                                onRestaurantIdsChange={setRestaurantIds}
                                restaurantId={restaurantId}
                                restaurantIds={restaurantIds}
                                restaurants={PARTENAIRES}
                            />
                        }
                    />

                    <div className="space-y-6">
                        <TopStatsSection
                            debut={DEBUT}
                            enChargement={enChargement}
                            fin={FIN}
                            mainKPIs={donnees.mainKPIs}
                        />
                        <ChartsSection
                            geographicData={donnees.geographicData}
                            weeklyActivityData={donnees.weeklyActivity}
                        />
                        <MiddleStatsSection
                            enChargement={enChargement}
                            secondaryKPIs={donnees.secondaryKPIs}
                        />
                        <FinancialDetailsSection
                            consolide={selection.consolide}
                            debut={DEBUT}
                            detailDisponible={(parStore?.length ?? 0) > 0}
                            financialDetails={donnees.financialDetails}
                            fin={FIN}
                            nombreEtablissements={selection.nombre}
                        />

                        {/* Nul en unitaire : le bloc n'apparait pas, comme sur l'ecran reel. */}
                        {parStore !== null && (
                            <DetailParStoreSection
                                enChargement={enChargement}
                                lignes={parStore}
                                raisonVide={selection.avertissement}
                            />
                        )}

                        <PerformanceSummarySection
                            mainKPIs={donnees.mainKPIs}
                            secondaryKPIs={donnees.secondaryKPIs}
                            sujetSelection={selection.sujet}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
