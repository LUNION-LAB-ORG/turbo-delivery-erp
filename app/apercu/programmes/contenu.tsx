'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { CarburantRapideModal } from '@/components/turboys/programmes/carburant-rapide-modal';
import { DuplicationSemaineDialog } from '@/components/turboys/programmes/duplication-semaine-dialog';
import { EngagementCarburant } from '@/components/turboys/programmes/engagement-carburant';
import { ProgrammeApercuModal } from '@/components/turboys/programmes/programme-apercu-modal';
import { HistoriqueProgramme } from '@/components/turboys/programmes/programme-historique-modal';
import { WeeklyJoursEditor, defaultJours } from '@/components/turboys/programmes/weekly-jours-editor';
import { SemaineProgrammes } from '@/features/programmes/refonte/semaine-programmes';
import type { IAuditAction } from '@/features/supervision/types';
import type {
    IAutosuffisanceJour,
    IJourProgramme,
    IProgramme,
    StatutProgramme,
} from '@/features/turboys/types/programme.types';
import { exporterProgrammesExcel, exporterProgrammesPdf, libelleMontantGroupe, regrouperPourExport } from '@/features/turboys/utils/programmes-export.utils';

/** Le banc de la semaine des programmes : quatre jeux d'essai, deux thèmes, trois états. */

const NOMS = [
    'OTE Azo', 'KOHI Albert Rene', 'DIABATE Moussa', 'KONE Salif', 'YAO Kouassi',
    'TRAORE Ibrahim', 'BAMBA Adama', 'COULIBALY Seydou', 'OUATTARA Lassina', 'DIALLO Mamadou',
    'SANOGO Karim', 'FOFANA Aboubacar', 'TOURE Bakary', 'CISSE Yacouba',
];

const RESTOS = ['Chez Paul, Cocody', 'Le Bistrot, Plateau', 'Kfc Marcory', 'La Villa, Riviera'];
const SITES = new Map(RESTOS.map((nom, i) => [`r${i}`, { commune: ['Cocody', 'Plateau', 'Marcory', 'Riviera'][i], nom }]));
const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
const TYPES = ['JOURNALIER', 'SUPERVISEUR_LIVREUR', 'INDEPENDANT'];

/** Reproductible : deux rendus doivent montrer la même chose. */
function fabriquer(graine: number, nb: number, statuts: StatutProgramme[]): IProgramme[] {
    let e = graine;
    const suivant = () => {
        e = (e * 1103515245 + 12345) % 2147483648;
        return e / 2147483648;
    };
    // Les forfaits journaliers du document papier : 4 000 pour un journalier, 2 000 pour
    // un superviseur ; l'independant ne touche rien. Un programme sur six n'a rien de saisi.
    const JOURNALIER_PAR_TYPE: Record<string, number | null> = { INDEPENDANT: null, JOURNALIER: 4000, SUPERVISEUR_LIVREUR: 2000 };
    return Array.from({ length: nb }).map((_, i) => {
        const statut = statuts[Math.floor(suivant() * statuts.length)];
        const type = TYPES[i % TYPES.length];
        const montantJour = i % 6 === 5 ? null : JOURNALIER_PAR_TYPE[type];
        const jours: IJourProgramme[] = JOURS.map((j, k) => {
            const absence = i % 4 === 1 && k === 2;
            const actif = !absence && suivant() > 0.22;
            return {
                absenceJustifiee: absence ? false : null,
                statutJour: absence ? 'ABSENT' : null,
                actif,
                date: `2026-08-${String(24 + k).padStart(2, '0')}`,
                debut: actif ? `0${6 + (k % 3)}:00:00` : null,
                fin: actif ? `1${6 + (k % 3)}:30:00` : null,
                jour: j,
                montantCarburant: actif ? montantJour : null,
                postes: actif ? [{ restaurantId: `r${i % RESTOS.length}`, restaurantNom: RESTOS[i % RESTOS.length] }] : [],
            };
        });
        // Une semaine sur cinq est en sept jours sur sept : le repos n'a pas ete pris.
        if (i % 5 === 2) jours.forEach((j) => { j.actif = true; j.statutJour = null; j.montantCarburant = montantJour; });
        // Fige par le serveur des que le programme est parti chez le livreur.
        const engage = statut === 'NOTIFIE' || statut === 'ACCEPTE' || statut === 'REFUSE';
        const somme = jours.reduce((t, j) => (j.actif && j.montantCarburant != null ? t + j.montantCarburant : t), 0);
        const aUnMontant = jours.some((j) => j.actif && j.montantCarburant != null);
        // Le WhatsApp : parti, refuse par Twilio, sans numero, ou jamais tente.
        const whatsapp = !engage
            ? { whatsappStatut: null, whatsappLe: null, whatsappDetail: null }
            : i % 4 === 0
              ? { whatsappStatut: 'ENVOYE', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: 'SM7f3a' }
              : i % 4 === 1
                ? { whatsappStatut: 'ECHEC', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: 'Twilio refuse nos identifiants (code 20003) : le jeton TWILIO_AUTH_TOKEN est absent ou revoque.' }
                : i % 4 === 2
                  ? { whatsappStatut: 'SANS_NUMERO', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: "Le livreur n'a pas de numero a dix chiffres sur sa fiche." }
                  : { whatsappStatut: 'NON_CONFIGURE', whatsappLe: '2026-08-24T07:12:00Z', whatsappDetail: 'Aucun gabarit WhatsApp declare pour les programmes.' };
        return {
            ...whatsapp,
            // Un livreur sur sept n'a pas de site : le groupe « Sans site rattache » doit exister.
            siteId: i % 7 === 6 ? null : `r${i % RESTOS.length}`,
            siteDeLaSemaine: i % 3 === 0 && i % 7 !== 6,
            montantCarburantHebdo: engage && aUnMontant ? somme : null,
            accepteLe: null,
            annee: 2026,
            id: `p${graine}-${i}`,
            jours,
            livreurId: `l${i}`,
            livreurNom: NOMS[i % NOMS.length],
            motifRefus: statut === 'REFUSE' ? 'Je suis en congé cette semaine, je l’avais signalé au superviseur.' : null,
            nbRelances: 0,
            publieLe: null,
            refuseLe: null,
            semaine: 35,
            source: 'ERP',
            statut,
            typeLivreur: type,
        } satisfies IProgramme;
    });
}

const AUTOSUFFISANCE: IAutosuffisanceJour[] = JOURS.map((j, k) => {
    const independants = 4 + ((k * 3) % 7);
    const planifies = 9 + ((k * 5) % 11);
    return { independants, jour: j, planifies, total: independants + planifies };
});

const JEUX = {
    ordinaire: {
        libelle: 'Semaine ordinaire',
        lignes: fabriquer(11, 14, ['BROUILLON', 'PLANIFIE', 'NOTIFIE', 'ACCEPTE', 'REFUSE']),
    },
    aPublier: { libelle: 'Tout à publier', lignes: fabriquer(29, 12, ['BROUILLON', 'PLANIFIE']) },
    publiee: { libelle: 'Semaine lancée', lignes: fabriquer(41, 12, ['NOTIFIE', 'ACCEPTE']) },
    vide: { libelle: 'Aucun programme', lignes: [] as IProgramme[] },
};

const INDEPENDANTS = fabriquer(97, 5, ['ACCEPTE']);

/**
 * Bascule le thème sur `<html>`, pas sur une enveloppe.
 *
 * <p>Un `<div class="dark">` MENT : `styles/tailwind.css` déclare encore les jetons
 * shadcn en triplets HSL bruts dans la même portée `.dark` que HeroUI, et sur un div
 * imbriqué c'est le triplet qui gagne — `bg-success` ne peint alors plus rien.</p>
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

/** L'éditeur d'un programme, seul, pour voir et piloter la saisie du carburant. */
function BancEditeur() {
    const [jours, setJours] = React.useState<IJourProgramme[]>(() =>
        defaultJours().map((j, i) => (i < 6 ? { ...j, actif: true, montantCarburant: i < 3 ? 4000 : null } : j)),
    );
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">L&apos;éditeur, tel qu&apos;il s&apos;ouvre dans la modale</h2>
            <WeeklyJoursEditor
                onChange={setJours}
                restaurants={RESTOS.map((r, i) => ({ id: `r${i}`, nom: r }))}
                value={jours}
            />
        </section>
    );
}

/** La saisie rapide du carburant : un programme publié sans montant, puis trois en lot. */
function BancCarburantRapide({ programmes }: { programmes: IProgramme[] }) {
    const [cibles, setCibles] = React.useState<IProgramme[]>([]);
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">Le carburant en un geste</h2>
            <div className="flex flex-wrap gap-2">
                <Button onPress={() => setCibles([programmes[0]])} size="sm" variant="outline">
                    Carburant de {programmes[0].livreurNom}
                </Button>
                <Button onPress={() => setCibles(programmes)} size="sm" variant="outline">
                    Carburant de {programmes.length} programmes cochés
                </Button>
            </div>
            <CarburantRapideModal
                isOpen={cibles.length > 0}
                onOpenChange={(o) => {
                    if (!o) setCibles([]);
                }}
                programmes={cibles}
            />
        </section>
    );
}

/** La duplication d'une semaine : la cible vide, puis la cible déjà servie. */
function BancDuplication() {
    const [etat, setEtat] = React.useState<'ferme' | 'vide' | 'occupee'>('ferme');
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">Dupliquer la semaine précédente</h2>
            <div className="flex flex-wrap gap-2">
                <Button onPress={() => setEtat('vide')} size="sm" variant="outline">
                    Semaine cible vide
                </Button>
                <Button onPress={() => setEtat('occupee')} size="sm" variant="outline">
                    Semaine cible déjà servie
                </Button>
            </div>
            <DuplicationSemaineDialog
                nbDejaLa={etat === 'occupee' ? 14 : 0}
                onDupliquer={() => setEtat('ferme')}
                onFermer={() => setEtat('ferme')}
                ouvert={etat !== 'ferme'}
                semaineCible={{ annee: 2026, semaine: 35 }}
                semaineSource={{ annee: 2026, semaine: 34 }}
            />
        </section>
    );
}

/** Le journal d'audit d'un programme, tel qu'il se lit dans sa fenêtre. */
const ACTIONS: IAuditAction[] = [
    {
        chemin: '/api/erp/programmes/dupliquer', dureeMs: 412, ecran: 'Programmes', entiteId: 'p11-1', entiteLibelle: 'Emploi du temps',
        entiteType: 'Emploi du temps', erreur: null, httpMethode: 'POST', id: 'a1', ip: '10.0.0.4', module: 'Planification',
        occurredAt: '2026-08-24T08:02:00Z', role: 'OPS_MANAGER', sessionId: null, statutHttp: 200, succes: true, typeAction: 'CREATION',
        utilisateur: 'Ramata Coulibaly', utilisateurId: 'u1',
        valeursApres: { jours: 'LUN 08:00-17:00 4000 F [Kfc Marcory] ; MAR 08:00-17:00 4000 F ; MER repos ; JEU 08:00-17:00 4000 F ; VEN 08:00-17:00 4000 F ; SAM repos ; DIM repos', statutProgramme: 'BROUILLON', sitePartnerId: 'r2' },
        valeursAvant: null,
    },
    {
        chemin: '/api/erp/programmes/p11-1', dureeMs: 96, ecran: 'Programmes', entiteId: 'p11-1', entiteLibelle: 'Emploi du temps',
        entiteType: 'Emploi du temps', erreur: null, httpMethode: 'PUT', id: 'a2', ip: '10.0.0.4', module: 'Planification',
        occurredAt: '2026-08-24T08:19:00Z', role: 'OPS_MANAGER', sessionId: null, statutHttp: 200, succes: true, typeAction: 'MODIFICATION',
        utilisateur: 'Ramata Coulibaly', utilisateurId: 'u1',
        valeursApres: { jours: 'LUN 08:00-17:00 3000 F [Kfc Marcory] ; MAR 08:00-17:00 3000 F ; MER repos ; JEU 08:00-17:00 3000 F ; VEN 08:00-17:00 3000 F ; SAM repos ; DIM repos', sitePartnerId: 'r0' },
        valeursAvant: { jours: 'LUN 08:00-17:00 4000 F [Kfc Marcory] ; MAR 08:00-17:00 4000 F ; MER repos ; JEU 08:00-17:00 4000 F ; VEN 08:00-17:00 4000 F ; SAM repos ; DIM repos', sitePartnerId: 'r2' },
    },
    {
        chemin: '/api/erp/programmes/p11-1/publier', dureeMs: 288, ecran: 'Programmes', entiteId: 'p11-1', entiteLibelle: 'Emploi du temps',
        entiteType: 'Emploi du temps', erreur: null, httpMethode: 'POST', id: 'a3', ip: '10.0.0.4', module: 'Planification',
        occurredAt: '2026-08-24T08:31:00Z', role: 'OPS_MANAGER', sessionId: null, statutHttp: 200, succes: true, typeAction: 'MODIFICATION',
        utilisateur: 'Ramata Coulibaly', utilisateurId: 'u1',
        valeursApres: { montantCarburantHebdo: 12000, statutProgramme: 'NOTIFIE', whatsappStatut: 'ECHEC' },
        valeursAvant: { montantCarburantHebdo: null, statutProgramme: 'BROUILLON', whatsappStatut: null },
    },
];

/** L'historique d'un programme et le regroupement des exports, côte à côte. */
function BancHistorique() {
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">L&apos;historique d&apos;un programme</h2>
            <HistoriqueProgramme actions={ACTIONS} sites={new Map(Array.from(SITES, ([id, s]) => [id, s.nom]))} />
        </section>
    );
}

/** Le regroupement du document papier : ce que les exports produisent. */
function BancExports({ programmes }: { programmes: IProgramme[] }) {
    const ctx = { carburantSemainePrecedente: 573000, sites: SITES };
    const s = regrouperPourExport(programmes, ctx);
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">Les exports, groupés par site</h2>
            <div className="mb-3 flex flex-wrap gap-2">
                <Button onPress={() => exporterProgrammesExcel(programmes, 2026, 35, ctx)} size="sm" variant="outline">
                    Excel
                </Button>
                <Button onPress={() => exporterProgrammesPdf(programmes, 2026, 35, 'Tous', ctx)} size="sm" variant="outline">
                    PDF
                </Button>
            </div>
            <ul className="flex flex-col gap-1 text-xs">
                {[...s.livreurs, ...s.supervision].map((g) => (
                    <li className="flex items-baseline justify-between gap-4" key={g.cle}>
                        <span className="text-foreground">
                            {g.titre} <span className="text-muted">{g.sousTitre}</span>
                        </span>
                        <span className="tabular-nums text-foreground">
                            {g.programmes.length} · {libelleMontantGroupe(g)}
                        </span>
                    </li>
                ))}
                <li className="mt-1 flex items-baseline justify-between gap-4 border-t border-separator pt-1 font-semibold">
                    <span>Grand total</span>
                    <span className="tabular-nums">{s.total.toLocaleString('fr-FR')} FCFA</span>
                </li>
            </ul>
        </section>
    );
}

/** L'aperçu individuel, avec un numéro pour voir le partage WhatsApp. */
function BancApercu({ programme }: { programme: IProgramme }) {
    const [ouvert, setOuvert] = React.useState(false);
    return (
        <section className="mt-6 rounded-lg border border-separator p-4">
            <h2 className="mb-3 text-sm font-semibold">L&apos;aperçu individuel</h2>
            <Button onPress={() => setOuvert(true)} size="sm" variant="outline">
                Ouvrir l&apos;aperçu de {programme.livreurNom}
            </Button>
            <ProgrammeApercuModal
                annee={2026}
                isOpen={ouvert}
                onOpenChange={setOuvert}
                programme={programme}
                semaine={35}
                siteNom={programme.siteId ? (SITES.get(programme.siteId)?.nom ?? null) : null}
                telephone="07 00 00 00 00"
            />
        </section>
    );
}

export default function ApercuProgrammes() {
    const [jeu, setJeu] = React.useState<keyof typeof JEUX>('ordinaire');
    const [etat, setEtat] = React.useState<'normal' | 'chargement' | 'echec'>('normal');
    const [sombre, setSombre] = useThemeSombre();
    const [semaine, setSemaine] = React.useState(35);
    const [type, setType] = React.useState('TOUS');
    const [partenaire, setPartenaire] = React.useState('TOUS');
    const [journal, setJournal] = React.useState<string[]>([]);
    const noter = (m: string) => setJournal((j) => [...j, m]);

    return (
        <div>
            <div className="min-h-screen bg-background text-foreground">
                <header className="flex flex-wrap items-center gap-2 border-b border-separator px-4 py-2 text-xs">
                    <span className="font-bold uppercase tracking-wider">Aperçu · Programmes</span>
                    {(Object.keys(JEUX) as (keyof typeof JEUX)[]).map((k) => (
                        <Button key={k} onPress={() => setJeu(k)} size="sm" variant={jeu === k ? 'primary' : 'ghost'}>
                            {JEUX[k].libelle}
                        </Button>
                    ))}
                    <span className="mx-1 h-4 w-px bg-separator" />
                    {(['normal', 'chargement', 'echec'] as const).map((e) => (
                        <Button key={e} onPress={() => setEtat(e)} size="sm" variant={etat === e ? 'secondary' : 'ghost'}>
                            {e}
                        </Button>
                    ))}
                    <Button className="ms-auto" onPress={() => setSombre((v) => !v)} size="sm" variant="outline">
                        {sombre ? 'sombre' : 'clair'}
                    </Button>
                </header>

                {journal.length > 0 && (
                    <p className="border-b border-separator px-4 py-1 text-xs text-muted">
                        {journal[journal.length - 1]}
                    </p>
                )}

                <main className="mx-auto max-w-[1600px] p-4">
                    <SemaineProgrammes
                        annee={2026}
                        autosuffisance={AUTOSUFFISANCE}
                        autosuffisanceIsError={etat === 'echec'}
                        autosuffisanceIsLoading={etat === 'chargement'}
                        carburantSemainePrecedente={jeu === 'vide' ? null : 573000}
                        engagement={
                            jeu === 'publiee' ? (
                                <EngagementCarburant
                                    etat={{
                                        annee: 2026,
                                        ecart: 24000,
                                        engagement: {
                                            createdAt: '2026-08-24T08:00:00Z',
                                            creerPar: 'Ramata Coulibaly',
                                            dateDepense: '2026-08-24',
                                            designation: 'Carburant programmes semaine 35/2026',
                                            id: 'charge-apercu',
                                            montant: 150000,
                                            statut: 'EN_ATTENTE_DGA',
                                        },
                                        nbProgrammesPublies: 8,
                                        nbProgrammesSansMontant: 2,
                                        semaine: 35,
                                        totalPublie: 174000,
                                    }}
                                    onEngager={() => noter('Mise à jour de l’engagement')}
                                    peutEngager
                                />
                            ) : (
                                <EngagementCarburant
                                    etat={{
                                        annee: 2026,
                                        ecart: null,
                                        engagement: null,
                                        nbProgrammesPublies: 6,
                                        nbProgrammesSansMontant: 1,
                                        semaine: 35,
                                        totalPublie: 120000,
                                    }}
                                    onEngager={() => noter('Engagement demandé')}
                                    peutEngager
                                />
                            )
                        }
                        independants={INDEPENDANTS}
                        independantsIsError={etat === 'echec'}
                        independantsIsLoading={etat === 'chargement'}
                        isError={etat === 'echec'}
                        isLoading={etat === 'chargement'}
                        onApercu={(p) => noter(`Aperçu de ${p.livreurNom}`)}
                        onCarburant={(p) => noter(`Carburant de ${p.livreurNom}`)}
                        onCarburantLot={(ps) => noter(`Carburant en lot sur ${ps.length} programme(s)`)}
                        onDupliquerSemainePrecedente={() => noter('Duplication de la semaine précédente')}
                        onEditer={(p) => noter(`Édition de ${p.livreurNom}`)}
                        onEnvoyer={(p) => noter(`Envoi au livreur ${p.livreurNom}`)}
                        onExporterExcel={() => noter('Export Excel')}
                        onExporterPdf={() => noter('Export PDF')}
                        onHistorique={(p) => noter(`Historique de ${p.livreurNom}`)}
                        onImporterFichier={() => noter('Import de fichier')}
                        onNouveau={() => noter('Nouveau programme')}
                        onPartenaireFiltre={setPartenaire}
                        onPlanifier={(p) => noter(`Planification de ${p.livreurNom}`)}
                        onPublier={(p) => noter(`Publication de ${p.livreurNom}`)}
                        onPublierLot={(ids) => noter(`Publication en lot de ${ids.length} programme(s)`)}
                        onReessayer={() => noter('Relecture demandée')}
                        onRenvoyerWhatsApp={(p) => noter(`WhatsApp renvoyé à ${p.livreurNom}`)}
                        onReessayerIndependants={() => noter('Relecture des indépendants')}
                        onSemaine={(d) => setSemaine((s) => s + d)}
                        onSupprimer={(p) => noter(`Suppression de ${p.livreurNom}`)}
                        onTelechargerModele={() => noter('Téléchargement du modèle')}
                        onTypeFiltre={setType}
                        partenaireFiltre={partenaire}
                        partenaires={RESTOS.map((r, i) => ({ id: `r${i}`, nom: r }))}
                        programmes={JEUX[jeu].lignes}
                        semaine={semaine}
                        typeFiltre={type}
                        typeOptions={[
                            { cle: 'TOUS', libelle: 'Tous' },
                            { cle: 'JOURNALIER', libelle: 'Journaliers' },
                            { cle: 'SUPERVISEUR_LIVREUR', libelle: 'Superviseurs' },
                            { cle: 'INDEPENDANT', libelle: 'Indépendants' },
                        ]}
                    />
                    <BancEditeur />
                    <BancExports programmes={JEUX.ordinaire.lignes} />
                    <BancDuplication />
                    <BancHistorique />
                    <BancApercu programme={JEUX.ordinaire.lignes[1]} />
                    <BancCarburantRapide programmes={[JEUX.ordinaire.lignes[5], JEUX.ordinaire.lignes[3], JEUX.ordinaire.lignes[4]]} />
                </main>
            </div>
        </div>
    );
}
