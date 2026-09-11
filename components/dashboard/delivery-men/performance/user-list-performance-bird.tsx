'use client';

import { useMemo, useState } from 'react';

import DropDownActionPerformance from './drop-down-action-performance';
import { EtatPerformance, type LignePerformance } from '@/features/performance/refonte/etat-performance';

/**
 * L'état de performance hebdomadaire.
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/performance/refonte/etat-performance.tsx`, qui porte le rendu. Ce fichier ne
 * fait plus que regrouper les livreurs par semaine et fournir le menu de ligne.</p>
 *
 * <h3>Ce qui a été retiré, et pourquoi</h3>
 * <p>La PAGINATION CLIENTE. Elle découpait en pages de cinq des données déjà toutes reçues
 * du serveur : la semaine entière arrivait, l'écran en montrait cinq, et il fallait
 * paginer pour voir le sixième livreur d'un état de paie. Elle disparaît — la liste est
 * complète, et le tri et la recherche remplacent le feuilletage.</p>
 */

const MOIS: Record<string, string> = {
    '01': 'janv.', '02': 'févr.', '03': 'mars', '04': 'avril', '05': 'mai', '06': 'juin',
    '07': 'juil.', '08': 'août', '09': 'sept.', '10': 'oct.', '11': 'nov.', '12': 'déc.',
};

interface Props {
    data: LivreurPerformanceBirdEndTorubo[];
}

/** La cle du groupe des livreurs sans emploi du temps sur la periode. */
const SANS_CRENEAU = 'sans-creneau';
const LIBELLE_SANS_CRENEAU = 'Aucun créneau créé';

export default function UserListPerformanceBird({ data }: Props) {
    /** Un libellé de semaine lisible, à partir des deux bornes du créneau. */
    const libelle = (debut: string, fin: string) => {
        const jd = debut?.slice(8, 10);
        const jf = fin?.slice(8, 10);
        const m = MOIS[fin?.slice(5, 7) ?? debut?.slice(5, 7)] ?? '';
        return `${jd} – ${jf} ${m}`;
    };

    /*
     * Les livreurs arrivent a plat, chacun portant son creneau. On les regroupe par
     * semaine : c'est la semaine qui fait l'etat de paie, pas la ligne.
     */
    const semaines = useMemo(() => {
        const par = new Map<string, { cle: string; libelle: string; lignes: LignePerformance[] }>();
        for (const l of data) {
            /*
             * Un livreur SANS emploi du temps sur la periode n'a pas de creneau. Il va
             * dans son propre groupe, nomme, plutot que de disparaitre ou de faire tomber
             * la page : le cahier des charges « Performance de la Flotte » (2.2) demande
             * qu'il reste visible avec un statut explicite et des indicateurs a zero.
             *
             * `l.creneau.debut` etait lu sans garde a cet endroit precis.
             */
            const cle = l.creneau ? `${l.creneau.debut}-${l.creneau.fin}` : SANS_CRENEAU;
            if (!par.has(cle)) {
                par.set(cle, {
                    cle,
                    libelle: l.creneau ? libelle(l.creneau.debut, l.creneau.fin) : LIBELLE_SANS_CRENEAU,
                    lignes: [],
                });
            }
            par.get(cle)!.lignes.push({
                id: l.id,
                nomComplet: l.nomComplet,
                avatarUrl: l.avatarUrl,
                etats: l.etats,
                performance: l.performance,
                commission: l.commission,
                prime: l.prime,
            });
        }
        /*
         * Le groupe « Aucun créneau créé » passe EN DERNIER, quoi qu'il arrive.
         *
         * Les groupes sortaient dans l'ordre d'insertion, c'est-a-dire dans l'ordre du
         * serveur, qui trie par date de creation decroissante. Or les livreurs les plus
         * recemment inscrits sont justement ceux qui n'ont pas encore de creneau : le
         * premier groupe aurait donc ete « Aucun créneau créé », et c'est lui qui se serait
         * ouvert par defaut.
         */
        const groupes = Array.from(par.values());
        return [
            ...groupes.filter((g) => g.cle !== SANS_CRENEAU),
            ...groupes.filter((g) => g.cle === SANS_CRENEAU),
        ];
    }, [data]);

    /*
     * L'onglet ouvert par defaut est une VRAIE SEMAINE, jamais le groupe des non planifies.
     *
     * Cet ecran porte en tete le total de commission et de prime de la semaine, et il sert a
     * lire un etat de paie. S'ouvrir sur « Aucun créneau créé » aurait affiche
     * « Commission de la semaine : 0 FCFA » au-dessus d'une liste de lignes a zero - un
     * ecran juste, disant une chose fausse, sur la page ou l'on valide une paie.
     *
     * Le repli sur le groupe des non planifies n'a lieu que s'il est le SEUL : aucun livreur
     * du type n'a ete programme cette semaine, et c'est alors l'information a montrer.
     */
    const [semaineActive, setSemaineActive] = useState(
        () => semaines.find((s) => s.cle !== SANS_CRENEAU)?.cle ?? semaines[0]?.cle ?? '',
    );
    const active = semaines.find((s) => s.cle === semaineActive) ?? semaines[0];

    if (!active) return null;

    return (
        <EtatPerformance
            libelleSemaine={active.cle === SANS_CRENEAU ? active.libelle : `Semaine du ${active.libelle}`}
            lignes={active.lignes}
            onSemaine={setSemaineActive}
            rendreActions={(l) => <DropDownActionPerformance id={l.id} />}
            semaineActive={active.cle}
            semaines={semaines.map((s) => ({
                cle: s.cle,
                libelle: s.cle === SANS_CRENEAU ? s.libelle : `Semaine du ${s.libelle}`,
            }))}
        />
    );
}
