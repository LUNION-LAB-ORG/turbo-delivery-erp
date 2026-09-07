'use client';

import { Button, Card, Separator, Skeleton } from '@heroui-v3/react';
import { ArrowDownRight, Clock, Download, Layers, TrendingUp, Wallet } from 'lucide-react';

import { Ecart } from '@/components/commons/ecart';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDate, type DateValue } from '@internationalized/date';

import { JEUX_EXEMPLE, jeuParCle } from '@/features/finance-dashboard/apercu/jeux-exemple';
import { BandePerimetre } from '@/features/finance-dashboard/components/etat/bande-perimetre';
import { CarteIndicateur } from '@/features/finance-dashboard/components/etat/carte-indicateur';
import { GraphiqueMensuel } from '@/features/finance-dashboard/components/etat/graphique-mensuel';
import { DisponibiliteJour, RepartitionParc } from '@/features/finance-dashboard/components/etat/repartition-parc';
import { SelecteurPeriode, type Raccourci } from '@/features/finance-dashboard/components/etat/selecteur-periode';
import { TableauMensuel } from '@/features/finance-dashboard/components/etat/tableau-mensuel';
import { PlanSaisie } from '@/features/tickets/components/plan-saisie';
import { LignesPreparees, ligneComplete } from '@/features/tickets/components/lignes-preparees';
import { priceListKeys } from '@/features/price-list/queries/price-list.query';
import type { Ticket } from '@/types/bon-livraison.model';
import EtatErreur from '@/components/commons/EtatErreur';
import { Montant } from '@/components/commons/montant';
import { BandeauAction } from '@/features/finance-dashboard/components/etat/bandeau-action';
import { construireEtat } from '@/features/finance-dashboard/components/etat/construire-etat';
import { EtatFinancier } from '@/features/finance-dashboard/components/etat/etat-financier';
import { defineAbilityFor, type AppRole } from '@/lib/casl/ability';
import { cn } from '@/lib/utils';

/**
 * Prevalisation du tableau de bord propose.
 *
 * <p>La barre du haut n'appartient PAS a l'ecran : elle sert a le regarder dans les etats
 * qu'on oublie de verifier — periode vide, deficit, valeurs extremes, theme sombre, et
 * role de l'utilisateur. Tout ce qui est SOUS elle est l'ecran lui-meme.</p>
 */

/** Deux roles qui lisent la finance, deux qui n'en ont pas le droit. */
const ROLES_MONTRES: AppRole[] = ['COMPTABLE', 'DG', 'OPS_MANAGER', 'DIRECTEUR_OPERATIONS'];

export default function ApercuContenu() {
    const [cle, setCle] = useState('ordinaire');
    const [sombre, setSombre] = useState(false);
    const [role, setRole] = useState<AppRole>('COMPTABLE');
    const [etat, setEtat] = useState<'normal' | 'chargement' | 'echec'>('normal');
    const [raccourci, setRaccourci] = useState<Raccourci>('mois');
    // Etat local pour regarder le plan de saisie des tickets hors authentification.
    const [lignes, setLignes] = useState(12);
    const [livreurId, setLivreurId] = useState('l1');
    const [restaurantId, setRestaurantId] = useState('r1');
    const [dateSaisie, setDateSaisie] = useState('2026-09-03');
    const [preparees, setPreparees] = useState(12);
    const [lignesSaisie, setLignesSaisie] = useState<Ticket[]>(() =>
        Array.from({ length: 12 }, (_, k) => ({
            id: `l${k}`,
            code: k < 7 ? String(1687000 + k) : '',
            livreurId: 'l1',
            livreur: 'OTE Azo',
            restaurantId: 'r1',
            restaurant: 'CAFE FNEICH',
            zoneId: k < 7 ? 'z1' : undefined,
            nomZone: k < 7 ? 'ZONE 4 | BIÉTRY' : '',
            montantLivraison: k < 7 ? '1500' : '',
            montantCommande: k < 7 ? '13000' : '',
            coutLivraison: k < 7 ? '200' : '',
            date: '2026-09-03',
            heure: k < 7 ? '19:22' : '',
            isNew: true,
            isEditing: true,
        })),
    );
    const completees = lignesSaisie.filter(ligneComplete).length;

    // Le selecteur de zone lit la grille tarifaire par le cache de TanStack. On l'amorce
    // ici pour regarder le composant REEL hors authentification, sans lui ajouter de porte
    // derobee reservee a la mise au point.
    const qc = useQueryClient();
    useEffect(() => {
        qc.setQueryData(priceListKeys.byRestaurant('r1', 0, 100), {
            content: [
                { id: 'z1', name: 'ZONE 4 | BIÉTRY', zone: 'z4', distanceDebut: 0, distanceFin: 5, prix: 1500, commission: 200 },
                { id: 'z2', name: 'ZONE 3 (Limite feu de Bernabé) | ÉGLISE MÉTHODISTE', zone: 'z3', distanceDebut: 0, distanceFin: 8, prix: 2000, commission: 300 },
                { id: 'z3', name: 'TREICHVILLE | RUE DES PÊCHEURS', zone: 'tv', distanceDebut: 0, distanceFin: 6, prix: 1800, commission: 250 },
            ],
        });
    }, [qc]);

    const [plage, setPlage] = useState<{ start: DateValue; end: DateValue } | null>(null);
    const jeu = jeuParCle(cle);

    // Dates fixes : `new Date()` au rendu ferait diverger serveur et client.
    const debut = new Date('2026-09-01');
    const fin = new Date('2026-09-30');

    // Le VRAI moteur d'habilitation du projet, pas une imitation.
    const ability = defineAbilityFor(role);
    const voitFinance = ability.can('read', 'Finance');
    const voitLivreurs = ability.can('read', 'Livreur');

    // Le resultat, calcule ici pour etre ENONCE en tete.
    const resultat = jeu.statsGlobales.chiffreAffaire - jeu.resume.totalDepenses;
    const resultatPrecedent = jeu.statsPeriodePrecedente.chiffreAffaire - jeu.statsPeriodePrecedente.depenses;

    const sections = construireEtat({
        statsGlobales: jeu.statsGlobales,
        statsPeriodePrecedente: jeu.statsPeriodePrecedente,
        resume: jeu.resume,
        depenses: jeu.depenses,
        debut,
        fin,
    });

    const reperes = [
        { cle: 'partenaires', libelle: 'Partenaires actifs', valeur: jeu.effectifs.partenaireActif, href: '/restaurants' },
        {
            cle: 'turboys',
            libelle: 'Turboys',
            valeur: jeu.effectifs.turboys,
            href: '/delivery-men/men',
            details: [
                { libelle: 'Indép.', valeur: jeu.effectifs.turboysIndependant, href: '/delivery-men/men?typeLivreur=INDEPENDANT&tab=independant' },
                { libelle: 'Journ.', valeur: jeu.effectifs.turboysJournalier, href: '/delivery-men/men?typeLivreur=JOURNALIER&tab=journalier' },
                ...(jeu.effectifs.turboysSuperviseurLivreur !== undefined
                    ? [{ libelle: 'Superv.', valeur: jeu.effectifs.turboysSuperviseurLivreur, href: '/delivery-men/men?typeLivreur=SUPERVISEUR_LIVREUR&tab=superviseur_livreur' }]
                    : []),
            ],
        },
        { cle: 'personnel', libelle: 'Personnel Turbo', valeur: jeu.effectifs.personnel, href: '/personnel' },
        { cle: 'utilisateurs', libelle: 'Utilisateurs actifs', valeur: jeu.effectifs.utilisateurs, href: '/users' },
    ];

    // Les alertes d'exploitation. Toutes adossees a des requetes qui existent deja :
    // `useTraficLivreursQuery` pour l'etat du terrain, `useCreneauActifQuery` pour le
    // verrouillage. C'est ce que les maquettes avaient trouve de juste et que la
    // premiere version de cet ecran avait laisse tomber.
    const t = jeu.trafic;
    const heures = jeu.creneau.heuresAvantVerrouillage;

    const actions = [
        {
            cle: 'gps',
            titre: `${t.horsService} livreurs sans position GPS`,
            consequence: `Sur ${t.totalLivreurs} livreurs, autant n'apparaissent nulle part sur la carte du trafic : on ne peut ni les affecter, ni voir où ils sont.`,
            href: '/trafic',
            incise: 'la carte du trafic est vide',
            libelleAction: 'Voir le trafic',
            actif: voitLivreurs && t.horsService > 0,
        },
        {
            cle: 'dispo',
            titre: 'Aucun livreur disponible',
            consequence: `Personne n'est en file sur ${t.totalLivreurs} livreurs : soit la journée n'a pas commencé, soit le pointage ne remonte plus. Les offres de course ne partiront pas.`,
            href: '/delivery-men/pointages-a-valider',
            incise: 'les offres ne partiront pas',
            libelleAction: 'Vérifier les pointages',
            actif: voitLivreurs && t.disponibles === 0,
        },
        {
            cle: 'comptes',
            titre:
                jeu.comptesEnAttente > 1
                    ? `${jeu.comptesEnAttente} comptes livreurs attendent une validation`
                    : '1 compte livreur attend une validation',
            consequence: "Tant que le compte n'est pas validé, le livreur ne peut pas se connecter à l'application.",
            href: '/delivery-men/not-valide',
            incise: 'ils ne peuvent pas se connecter',
            libelleAction: 'Valider les comptes',
            actif: voitLivreurs && jeu.comptesEnAttente > 0,
        },
        {
            cle: 'creneau',
            titre: `Verrouillage des tickets dans ${heures} h`,
            consequence: `Semaine ${jeu.creneau.semaine}, ${jeu.creneau.ticketsSaisis} tickets saisis. Après le verrouillage, plus aucune saisie n'est possible sur la semaine.`,
            href: '/validation-tickets',
            incise: `semaine ${jeu.creneau.semaine}`,
            libelleAction: 'Saisir les tickets',
            actif: jeu.creneau.statut === 'OUVERT' && heures <= 48,
        },
    ];

    return (
        <div className={cn(sombre && 'dark')}>
            <div className="min-h-screen bg-background text-foreground">
                {/* Barre de contrôle de la prévisualisation — ne fait pas partie de l'écran. */}
                <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-separator bg-surface px-4 py-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">Aperçu</span>
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    {JEUX_EXEMPLE.map((j) => (
                        <button
                            className={cn(
                                'rounded-md px-2.5 py-1.5 text-xs transition-colors',
                                j.cle === cle ? 'bg-accent text-white' : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                            )}
                            key={j.cle}
                            onClick={() => setCle(j.cle)}
                            title={j.intitule}
                            type="button"
                        >
                            {j.cle}
                        </button>
                    ))}
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    {ROLES_MONTRES.map((r) => (
                        <button
                            className={cn(
                                'rounded-md px-2.5 py-1.5 text-xs transition-colors',
                                r === role ? 'bg-foreground text-background' : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                            )}
                            key={r}
                            onClick={() => setRole(r)}
                            type="button"
                        >
                            {r}
                        </button>
                    ))}
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    {(['normal', 'chargement', 'echec'] as const).map((e) => (
                        <button
                            className={cn(
                                'rounded-md px-2.5 py-1.5 text-xs transition-colors',
                                e === etat ? 'bg-foreground text-background' : 'text-muted hover:bg-surface-secondary hover:text-foreground',
                            )}
                            key={e}
                            onClick={() => setEtat(e)}
                            type="button"
                        >
                            {e}
                        </button>
                    ))}
                    <Separator className="mx-1 h-5" orientation="vertical" />
                    <button
                        className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:bg-surface-secondary hover:text-foreground"
                        onClick={() => setSombre((v) => !v)}
                        type="button"
                    >
                        {sombre ? 'sombre' : 'clair'}
                    </button>
                    <span className="ms-auto text-xs text-muted">{jeu.intitule}</span>
                </header>

                {/* ══ L'ÉCRAN PROPOSÉ COMMENCE ICI ══ */}
                <main className="mx-auto flex max-w-[1400px] flex-col gap-4 p-4">
                    <PlanSaisie
                        completees={completees}
                        etat={{
                            nombreLignes: lignes,
                            livreurId,
                            restaurantId,
                            date: dateSaisie,
                            setNombreLignes: setLignes,
                            setLivreurId,
                            setRestaurantId,
                            setDate: setDateSaisie,
                        }}
                        heuresAvantVerrouillage={jeu.creneau.heuresAvantVerrouillage}
                        livreurs={[
                            { value: 'l1', label: 'OTE Azo' },
                            { value: 'l2', label: 'KOHI Albert Rene' },
                        ]}
                        onPreparer={() => {
                            setPreparees(lignes);
                            setLignesSaisie(
                                Array.from({ length: lignes }, (_, k) => ({
                                    id: `n${k}`,
                                    code: '',
                                    livreurId,
                                    livreur: '',
                                    restaurantId,
                                    restaurant: '',
                                    montantLivraison: '',
                                    montantCommande: '',
                                    coutLivraison: '',
                                    date: dateSaisie,
                                    heure: '',
                                    isNew: true,
                                    isEditing: true,
                                })),
                            );
                        }}
                        peutCreer
                        preparees={preparees}
                        restaurants={[
                            { value: 'r1', label: 'CAFE FNEICH' },
                            { value: 'r2', label: 'TAYBA ZONE 4' },
                        ]}
                    />

                    <LignesPreparees
                        livreurOptions={[
                            { value: 'l1', label: 'OTE Azo' },
                            { value: 'l2', label: 'KOHI Albert Rene' },
                        ]}
                        onChange={(id, champ, valeur) =>
                            setLignesSaisie((prec) =>
                                prec.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)),
                            )
                        }
                        onEnregistrerLot={async (ids: string[]) => {
                            setLignesSaisie((prec) => prec.filter((l) => !ids.includes(l.id)));
                            return { reussis: ids.length, echoues: 0 };
                        }}
                        onPatch={(id, patch) =>
                            setLignesSaisie((prec) => prec.map((l) => (l.id === id ? { ...l, ...patch } : l)))
                        }
                        onRetirer={(id) => setLignesSaisie((prec) => prec.filter((l) => l.id !== id))}
                        restaurantOptions={[
                            { value: 'r1', label: 'CAFE FNEICH' },
                            { value: 'r2', label: 'TAYBA ZONE 4' },
                        ]}
                        /* Le banc porte les DEUX types de commission : au pourcentage et
                           au montant fixe, pour voir les deux calculs a l'ecran. */
                        restaurants={[
                            { commission: 4, id: 'r1', nomEtablissement: 'CAFE FNEICH', typeCommission: 'POURCENTAGE' },
                            { commission: 300, id: 'r2', nomEtablissement: 'TAYBA ZONE 4', typeCommission: 'FIXE' },
                        ] as never}
                        tickets={lignesSaisie}
                    />

                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h1 className="text-xl font-bold">Pilotage Turbo Delivery</h1>
                            <p className="text-sm text-muted">Du 1<sup>er</sup> au 30 septembre 2026</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <SelecteurPeriode
                                libelle="01/09 – 30/09"
                                onPlage={(p) => {
                                    setPlage(p);
                                    setRaccourci(p ? 'libre' : 'mois');
                                }}
                                onRaccourci={(r) => {
                                    setRaccourci(r);
                                    if (r !== 'libre') setPlage(null);
                                }}
                                plage={
                                    plage ?? {
                                        // Date CALENDAIRE : `fromDate` donne un ZonedDateTime,
                                        // dont les segments d'heure et de fuseau debordaient
                                        // la largeur d'un telephone.
                                        start: new CalendarDate(2026, 9, 1),
                                        end: new CalendarDate(2026, 9, 30),
                                    }
                                }
                                raccourci={raccourci}
                            />
                            {voitFinance && (
                                <Button size="sm" variant="outline">
                                    <Download aria-hidden="true" className="size-4" />
                                    Télécharger les détails
                                </Button>
                            )}
                        </div>
                    </div>

                    <BandeauAction elements={actions} />

                    <BandePerimetre reperes={reperes} />

                    {voitFinance && etat === 'echec' && (
                        <Card className="border border-danger/40 p-0">
                            <Card.Content className="p-0">
                                <EtatErreur
                                    onReessayer={() => setEtat('normal')}
                                    quoi="les indicateurs financiers"
                                />
                            </Card.Content>
                        </Card>
                    )}

                    {voitFinance && etat !== 'echec' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <CarteIndicateur
                                chargement={etat === 'chargement'}
                                href="/finance/revenue"
                                icone={Wallet}
                                libelle="Chiffre d'affaires"
                                libelleReference="vs août"
                                reference={jeu.statsPeriodePrecedente.chiffreAffaire}
                                sens="favorable"
                                valeur={jeu.statsGlobales.chiffreAffaire}
                            />
                            <CarteIndicateur
                                contexte={jeu.resume.totalDepenses === 0 ? 'aucune charge imputée' : undefined}
                                chargement={etat === 'chargement'}
                                href="/finance/dashboard"
                                icone={ArrowDownRight}
                                libelle="Dépenses"
                                libelleReference="vs août"
                                reference={jeu.statsPeriodePrecedente.depenses}
                                sens="defavorable"
                                valeur={jeu.resume.totalDepenses}
                            />
                            <CarteIndicateur
                                contexte={resultat >= 0 ? 'excédent' : 'déficit'}
                                chargement={etat === 'chargement'}
                                href="/finance/analyse-rentabilite"
                                icone={TrendingUp}
                                libelle="Marge"
                                libelleReference="vs août"
                                principal
                                reference={resultatPrecedent}
                                sens="favorable"
                                tonContexte={resultat >= 0 ? 'favorable' : 'attention'}
                                valeur={resultat}
                            />
                            <CarteIndicateur
                                contexte={
                                    jeu.statsGlobales.chiffreAffaire
                                        ? `${Math.round((jeu.resume.totalFacturesEnCours / jeu.statsGlobales.chiffreAffaire) * 100)} % du CA du mois`
                                        : undefined
                                }
                                chargement={etat === 'chargement'}
                                href="/finance/recouvrement?tab=factures"
                                icone={Clock}
                                libelle="Encours à recouvrer"
                                tonContexte="attention"
                                valeur={jeu.resume.totalFacturesEnCours}
                            />
                        </div>
                    )}

                    {voitFinance && etat !== 'echec' && (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            <Card className="lg:col-span-2">
                                <Card.Header>
                                    <Card.Title className="text-sm">Revenus et dépenses par mois · 2026</Card.Title>
                                    <Card.Description>
                                        La marge, en surimpression, est la différence des deux barres.
                                    </Card.Description>
                                </Card.Header>
                                {/*
                                 * `flex-1 min-h-0` fonctionne ICI parce que la hauteur de la carte
                                 * vient de la rangee de grille, pas de son contenu : le
                                 * `ResponsiveContainer` de Recharts a donc un parent mesurable.
                                 * Sans `min-h-0`, un enfant flexible refuse de se comprimer sous
                                 * sa taille naturelle et le graphique deborderait.
                                 */}
                                <Card.Content className="min-h-0 flex-1">
                                    {etat === 'chargement' ? (
                                        <Skeleton className="h-full min-h-[260px] w-full rounded-lg" />
                                    ) : (
                                        <GraphiqueMensuel donnees={jeu.serieAnnuelle} />
                                    )}
                                </Card.Content>
                            </Card>

                            {/*
                             * Les deux cartes de cette rangee sont etirees a la meme hauteur par
                             * la grille : c'est le panneau, le plus haut, qui la fixe.
                             */}
                            <Card>
                                <Card.Header>
                                    <Card.Title className="text-sm">Détail du mois</Card.Title>
                                </Card.Header>
                                <Card.Content>
                                    <EtatFinancier
                                        libellePeriode="Septembre"
                                        masquerCumul
                                        sections={sections}
                                    />
                                </Card.Content>
                            </Card>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {voitFinance && (
                            <Card>
                                <Card.Header>
                                    <Card.Title className="flex items-center gap-2 text-sm">
                                        <Layers aria-hidden="true" className="size-4 text-muted" />
                                        Cumul depuis 2024
                                    </Card.Title>
                                </Card.Header>
                                <Card.Content>
                                    {etat === 'chargement' ? (
                                        <div className="space-y-2">
                                            {[0, 1, 2, 3].map((k) => (
                                                <Skeleton className="h-6 w-full rounded" key={k} />
                                            ))}
                                        </div>
                                    ) : etat === 'echec' ? (
                                        <EtatErreur compact onReessayer={() => setEtat('normal')} quoi="les cumuls" />
                                    ) : (
                                        <ul className="space-y-2">
                                            {[
                                                ["Chiffre d'affaires", jeu.resume.chiffreAffaireCumule, '/finance/revenue'],
                                                ['Dépenses', jeu.resume.totalDepensesCumule, '/finance/dashboard'],
                                                ['Marge', jeu.resume.margeCumule, '/finance/analyse-rentabilite'],
                                                ['Encours', jeu.resume.totalFacturesEnCoursCumule, '/finance/recouvrement?tab=factures'],
                                            ].map(([libelle, valeur, lien]) => (
                                                <li key={libelle as string}>
                                                    <a
                                                        className="flex items-baseline justify-between gap-4 rounded-sm py-0.5 hover:text-accent"
                                                        href={lien as string}
                                                    >
                                                        <span className="text-sm text-muted">{libelle as string}</span>
                                                        <Montant taille="sm" valeur={valeur as number} />
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </Card.Content>
                            </Card>
                        )}

                        <Card>
                            <Card.Header>
                                <Card.Title className="text-sm">
                                    Répartition du parc · {jeu.effectifs.turboys} turboys
                                </Card.Title>
                            </Card.Header>
                            <Card.Content>
                                <RepartitionParc
                                    parts={[
                                        { libelle: 'Indépendants', valeur: jeu.effectifs.turboysIndependant, couleur: '#2563eb' },
                                        { libelle: 'Journaliers', valeur: jeu.effectifs.turboysJournalier, couleur: '#d97706' },
                                        { libelle: 'Superviseurs-livreurs', valeur: jeu.effectifs.turboysSuperviseurLivreur ?? 0, couleur: '#15803d' },
                                    ]}
                                />
                            </Card.Content>
                        </Card>

                        <Card>
                            <Card.Header>
                                <Card.Title className="text-sm">Disponibilité du jour</Card.Title>
                                <Card.Description>
                                    {t.horsService} livreurs sur {t.totalLivreurs} n&apos;ont aucune position connue.
                                </Card.Description>
                            </Card.Header>
                            <Card.Content>
                                <DisponibiliteJour
                                    barres={[
                                        { libelle: 'En course', valeur: t.enActivite, couleur: '#2563eb' },
                                        { libelle: 'Disponibles', valeur: t.disponibles, couleur: '#15803d' },
                                        { libelle: 'Hors service', valeur: t.horsService, couleur: '#b91c1c' },
                                    ]}
                                    total={t.totalLivreurs}
                                />
                            </Card.Content>
                        </Card>
                    </div>

                    {voitFinance && etat !== 'echec' && (
                        <Card>
                            <Card.Header>
                                <Card.Title className="text-sm">Mois par mois · 2026</Card.Title>
                                <Card.Description>
                                    Les mêmes chiffres que le graphique, en valeurs exactes — un
                                    graphique seul n&apos;est pas lisible par un lecteur d&apos;écran.
                                </Card.Description>
                            </Card.Header>
                            <Card.Content>
                                {etat === 'chargement' ? (
                                    <div className="space-y-1.5">
                                        {Array.from({ length: 6 }).map((_, k) => (
                                            <Skeleton className="h-6 w-full rounded" key={k} />
                                        ))}
                                    </div>
                                ) : (
                                    <TableauMensuel annee={2026} lignes={jeu.serieAnnuelle} />
                                )}
                            </Card.Content>
                        </Card>
                    )}
                </main>
            </div>
        </div>
    );
}
