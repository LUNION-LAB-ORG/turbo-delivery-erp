'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { ChartsSection } from '@/features/rapports-performance/components/charts-section';
import { FinancialDetailsSection } from '@/features/rapports-performance/components/financial-details-section';
import { MiddleStatsSection } from '@/features/rapports-performance/components/middle-stats-section';
import { PerformanceHeader } from '@/features/rapports-performance/components/performance-header';
import { PerformanceSummarySection } from '@/features/rapports-performance/components/performance-summary-section';
import { TopStatsSection } from '@/features/rapports-performance/components/top-stats-section';
import type {
    IDashboardData,
    IGeographicLocation,
    IWeeklyActivity,
} from '@/features/rapports-performance/types/performance.type';

/**
 * Le banc du RAPPORT DE PERFORMANCE.
 *
 * <p>Il monte les VRAIS composants du rapport - entete, bandeau de tete, les deux
 * graphiques, bandeau du milieu, detail financier, resume - sur des donnees d'exemple.
 * Seule la lecture reseau est remplacee. Un banc qui remonterait la page a sa facon ne
 * montrerait pas l'ecran, il montrerait le banc.</p>
 *
 * <p>Il existe pour une raison precise : ce module portait trente-sept couleurs ecrites en
 * dur, dont une grille de graphique a `#f3f4f6` et une infobulle a fond blanc, invisibles
 * ou aveuglantes en theme sombre. Rien de tout cela ne se voit sans regarder l'ecran dans
 * les deux themes, et ces ecrans vivent derriere `app/(protected)/`, donc derriere une
 * session. Le bouton « sombre » de la barre du haut est le seul moyen honnete de verifier.</p>
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
        secondaryKPIs: {
            // Les deux valeurs que la production ne mesure pas : la page doit rendre un
            // tiret, jamais « 0 min » ni « 1 article ». Le banc les laisse donc a zero.
            averageDeliveryTime: 0,
            averageItemsPerOrder: 0,
            monthlyGrowth: -4 + suivant() * 28,
        },
        weeklyActivity: semaine,
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
    // Un banc qui n'envoie pas ce que le serveur envoie ne verifie rien. Sur une periode
    // sans course, la production rend `null` pour les trois : `calculateGrowth` sort en
    // `null` quand le mois precedent est vide, et les deux moyennes ne sont pas mesurees.
    // Un zero ferait afficher « 0 min », « 0.0% » et « 0 », soit trois faits inventes,
    // exactement ce que ce lot retire de l'ecran reel.
    secondaryKPIs: { averageDeliveryTime: null, averageItemsPerOrder: null, monthlyGrowth: null },
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
    const donnees = JEUX[jeu].donnees;

    // Le banc n'a pas d'URL a tenir : les memes valeurs, en etat local.
    const [restaurantId, setRestaurantId] = React.useState<string | undefined>(undefined);

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
                    onPress={() => setEnChargement((v) => !v)}
                    size="sm"
                    variant="outline"
                >
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
                        debut={DEBUT}
                        fin={FIN}
                        // Le banc n'exporte rien : le bouton est la pour etre REGARDE, a sa
                        // taille et a sa couleur reelles, pas pour ecrire un PDF.
                        onDateChange={() => undefined}
                        onExportPdf={() => undefined}
                        onRestaurantChange={setRestaurantId}
                        restaurantId={restaurantId}
                        selectedRestaurant="PLATO"
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
                        <FinancialDetailsSection financialDetails={donnees.financialDetails} />
                        <PerformanceSummarySection
                            mainKPIs={donnees.mainKPIs}
                            secondaryKPIs={donnees.secondaryKPIs}
                            selectedRestaurant="PLATO"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
