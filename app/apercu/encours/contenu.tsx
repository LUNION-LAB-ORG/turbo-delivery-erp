'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { EncoursCharts } from '@/components/finance/encours/encours-charts';
import { EncoursDeductionsTable } from '@/components/finance/encours/encours-deductions-table';
import { EncoursFiltres } from '@/components/finance/encours/encours-filtres';
import type { IEncoursFiltresValeurs } from '@/components/finance/encours/encours-filtres';
import { useHauteurReleve } from '@/components/finance/encours/encours-hauteur';
import { EncoursKpiCards } from '@/components/finance/encours/encours-kpi-cards';
import { EncoursMobileCards } from '@/components/finance/encours/encours-mobile-cards';
import { EncoursTable } from '@/components/finance/encours/encours-table';
import type { IEncoursDeduction, IEncoursReleve } from '@/features/encours';

/**
 * Le banc du releve ENCOURS.
 *
 * <p>Il monte les VRAIS composants du releve - barre de filtres, bandeau, tableau, cartes
 * tactiles, graphiques, recapitulatif des deductions - sur des donnees d'exemple. Seule la
 * lecture reseau est remplacee.</p>
 *
 * <p>La barre de filtres manquait, et c'etait le seul bloc que le banc ne pouvait pas
 * montrer : le vide blanc de 1600 x 340 qu'elle formait ne se verifiait donc nulle part.
 * Elle ne relit rien ici - aucun filtre ne rejoue les donnees d'exemple - mais elle est
 * a l'ecran, a sa taille reelle, et sa hauteur entre dans la mesure du cadre du releve,
 * ce qui est precisement ce qu'on doit pouvoir regarder.</p>
 *
 * <p>La largeur se bascule a 1000 px, la fenetre reelle des postes, parce que c'est la
 * seule largeur ou l'on voit ce que voit l'operateur : le seuil `lg` de Tailwind
 * (1024 px) ne s'y ouvre jamais.</p>
 */

const GROUPES = ['PIZZA ROMA', 'CHICKEN NATION', 'LE BISTROT', 'KFC ABIDJAN'];
const STORES = ['Cocody', 'Plateau', 'Marcory', 'Riviera'];
const STATUTS = ['Payé', 'Partiel', 'En retard', 'En cours', 'À venir'];
const CYCLES = ['MENSUEL', 'QUINZAINE', 'HEBDOMADAIRE'];

const MOTIFS = [
    'Avance versée le 12/06 en espèces au siège, à retenir sur les deux prochaines quinzaines',
    'Avance sur facture',
    "Régularisation de l'écart constaté sur la facture de mai après recomptage des courses annulées",
    null,
];

function alea(graine: number) {
    let e = graine;
    return () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
}

function fabriquer(graine: number, nbGroupes: number): IEncoursReleve {
    const suivant = alea(graine);
    const partenaires = Array.from({ length: nbGroupes }).map((_, gi) => {
        const cycle = CYCLES[gi % CYCLES.length];
        const stores = Array.from({ length: 1 + Math.floor(suivant() * 3) }).map((__, si) => {
            const factures = Array.from({ length: 1 + Math.floor(suivant() * 4) }).map((___, fi) => {
                const statut = STATUTS[(gi + si + fi) % STATUTS.length];
                const aVenir = statut === 'À venir';
                const total = aVenir ? null : 120000 + Math.round(suivant() * 900000);
                const acompte = !aVenir && suivant() < 0.4 ? Math.round((total ?? 0) * suivant()) : 0;
                const mois = 1 + ((gi + si + fi) % 12);
                return {
                    acompte: aVenir ? null : acompte,
                    complement: fi > 0 && suivant() < 0.25,
                    factureLieeCode: fi > 0 ? `FA-2026-00${fi}` : null,
                    libelle: cycle === 'MENSUEL' ? 'Mois' : cycle === 'QUINZAINE' ? 'Quinzaine 1/2' : 'Semaine 3',
                    mode: suivant() < 0.2 ? 'Plage de dates' : 'Cycle',
                    mois,
                    objet: suivant() < 0.3 ? 'Frais de livraison' : 'Globale',
                    origine: null,
                    periode: 'Août',
                    // Une periode a venir n'est pas encore facturee : elle n'a pas de bornes.
                    periodeDebut: aVenir ? null : `2026-0${1 + (mois % 9)}-01`,
                    periodeFin: aVenir ? null : `2026-0${1 + (mois % 9)}-15`,
                    solde: aVenir ? null : (total ?? 0) - acompte,
                    statut,
                    totalAPayer: total,
                };
            });
            const totalFacture = factures.reduce((n, f) => n + (f.totalAPayer ?? 0), 0);
            return {
                factures,
                reste: factures.reduce((n, f) => n + (f.solde ?? 0), 0),
                store: `${STORES[si % STORES.length]}`,
                totalFacture,
            };
        });
        const sousTotalFacture = stores.reduce((n, s) => n + s.totalFacture, 0);
        const deduction = suivant() < 0.4 ? Math.round(sousTotalFacture * 0.05) : 0;
        return {
            cycle: cycle as IEncoursReleve['partenaires'][number]['cycle'],
            deduction,
            groupe: GROUPES[gi % GROUPES.length],
            sousTotalFacture,
            sousTotalReste: stores.reduce((n, s) => n + s.reste, 0) - deduction,
            stores,
        };
    });

    const deductions: IEncoursDeduction[] = partenaires
        .filter((p) => p.deduction > 0)
        .map((p, i) => ({ montant: p.deduction, motif: MOTIFS[i % MOTIFS.length], partenaire: p.groupe }));

    return {
        annee: 2026,
        dateGeneration: '2026-09-05T10:00:00',
        deductions,
        factureParMois: Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [String(i + 1), Math.round(suivant() * 3000000)]),
        ),
        mois: null,
        moisColonnes: Array.from({ length: 12 }, (_, i) => i + 1),
        nbFactures: partenaires.reduce((n, p) => n + p.stores.reduce((m, s) => m + s.factures.length, 0), 0),
        nbPartenaires: partenaires.length,
        nbStores: partenaires.reduce((n, p) => n + p.stores.length, 0),
        partenaireFiltre: null,
        partenaires,
        resteParMois: Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [String(i + 1), Math.round(suivant() * 2000000)]),
        ),
        totalDeductions: deductions.reduce((n, d) => n + d.montant, 0),
        totalFacture: partenaires.reduce((n, p) => n + p.sousTotalFacture, 0),
        totalReste: partenaires.reduce((n, p) => n + p.sousTotalReste, 0),
    } as IEncoursReleve;
}

/** Tout est solde : plus rien en retard, la carte doit redevenir neutre. */
function sansRetard(releve: IEncoursReleve): IEncoursReleve {
    return {
        ...releve,
        partenaires: releve.partenaires.map((p) => ({
            ...p,
            stores: p.stores.map((s) => ({
                ...s,
                factures: s.factures.map((f) =>
                    f.statut === 'En retard' ? { ...f, statut: 'Partiel' } : f,
                ),
            })),
        })),
    };
}

const JEUX = {
    ordinaire: { libelle: 'Relevé ordinaire', releve: fabriquer(11, 4) },
    charge: { libelle: 'Portefeuille chargé', releve: fabriquer(37, 4) },
    aJour: { libelle: 'Rien en retard', releve: sansRetard(fabriquer(11, 4)) },
    vide: {
        libelle: 'Aucun reste',
        releve: {
            ...fabriquer(5, 0),
            deductions: [],
            partenaires: [],
            totalDeductions: 0,
            totalFacture: 0,
            totalReste: 0,
        } as IEncoursReleve,
    },
};

/**
 * Bascule le theme sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` declare encore les jetons
 * shadcn en triplets HSL bruts dans la meme portee `.dark` que HeroUI, et sur un div
 * imbrique c'est le triplet qui gagne - `bg-success` ne peint alors plus rien.</p>
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

export default function ApercuEncours() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [sombre, setSombre] = useThemeSombre();
    const [posteReel, setPosteReel] = React.useState(true);
    const releve = JEUX[jeu].releve;
    // Le banc n'a pas d'URL a tenir : les memes valeurs, en etat local.
    const [filtres, setFiltres] = React.useState<IEncoursFiltresValeurs>({
        annee: 2026,
        cycle: '',
        mois: '',
        partenaire: '',
        stores: [],
    });
    // Meme mesure que l'ecran reel : un banc qui fige une hauteur ne montre pas ce que
    // l'operateur voit, il montre ce que le banc a decide.
    const zoneReleveRef = React.useRef<HTMLDivElement>(null);
    const hauteurReleve = useHauteurReleve(zoneReleveRef);

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Encours</span>
                    {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                        <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                            {JEUX[k].libelle}
                        </Button>
                    ))}
                    <Button
                        className="ms-auto"
                        onPress={() => setPosteReel((v) => !v)}
                        size="sm"
                        variant="outline"
                    >
                        {posteReel ? 'fenêtre 1000 px' : 'pleine largeur'}
                    </Button>
                    <Button onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                <main
                    className="mx-auto flex flex-col gap-3 p-4"
                    style={{ maxWidth: posteReel ? 1000 : 1500 }}
                >
                    <div>
                        <h1 className="text-lg font-semibold leading-tight text-foreground">
                            Encours — Restes à payer
                        </h1>
                        <p className="text-xs text-muted">
                            Factures éditées non encore recouvrées — détail par facture (mois /
                            quinzaine / semaine)
                        </p>
                    </div>

                    <EncoursFiltres
                        groupes={GROUPES}
                        onChange={(partiel) => setFiltres((v) => ({ ...v, ...partiel }))}
                        valeurs={filtres}
                    />

                    <EncoursKpiCards releve={releve} />

                    <div ref={zoneReleveRef}>
                        <div className="hidden md:block">
                            <EncoursTable hauteur={hauteurReleve} releve={releve} />
                        </div>
                        <div className="md:hidden">
                            <EncoursMobileCards releve={releve} />
                        </div>
                    </div>

                    <EncoursCharts releve={releve} />

                    <EncoursDeductionsTable
                        deductions={releve.deductions}
                        total={releve.totalDeductions}
                    />
                </main>
            </div>
        </div>
    );
}
