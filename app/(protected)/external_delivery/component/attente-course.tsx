'use client';

import dayjs from 'dayjs';

/*
 * Depuis combien de temps une course attend un livreur.
 *
 * <h3>Pourquoi ce fichier existe</h3>
 * <p>Sur les cartes, l'anciennete etait de la PROSE posee dans un coin : « il y a 12 min »,
 * en gris, sous une horloge de 12 px. Une phrase ne se compare pas d'une carte a l'autre,
 * et c'est pourtant la seule question de cet ecran : laquelle attend depuis le plus
 * longtemps. En colonne, le « il y a » repete l'en-tete et fait perdre l'alignement des
 * chiffres ; il ne reste que la duree, en chasse tabulaire, alignee a droite.</p>
 *
 * <p>La date exacte n'est pas perdue pour autant : elle est sur l'info-bulle de la
 * cellule, la ou l'operateur la cherche quand il rapproche une course avec le
 * partenaire au telephone.</p>
 */

/*
 * Le dispatch automatique s'epuise en neuf minutes : cascade dans la file d'attente
 * (un rang de plus toutes les trois minutes), puis les birds en secours sous plafond.
 * Passe ce delai, plus aucun mecanisme ne travaille la course : seul un operateur peut
 * la faire avancer. C'est exactement ce que la teinte annonce, et rien d'autre.
 */
const SEUIL_RELANCE_MINUTES = 10;

/** Minutes ecoulees depuis un horodatage, ou `null` s'il est absent ou illisible. */
export function minutesDAttente(iso?: null | string): null | number {
    if (!iso) return null;
    const debut = new Date(iso).getTime();
    if (Number.isNaN(debut)) return null;
    return Math.max(0, Math.floor((Date.now() - debut) / 60000));
}

/**
 * Duree compacte : « 8 min », « 2 h 05 », « 1 j 03 h ».
 *
 * <p>Les minutes et les heures sont completees a deux chiffres au-dela de l'heure pour
 * que les lignes s'alignent verticalement : « 2 h 05 » sous « 11 h 40 ».</p>
 */
export function dureeCourte(minutes: number): string {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;

    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `${heures} h ${String(minutes % 60).padStart(2, '0')}`;

    const jours = Math.floor(heures / 24);
    return `${jours} j ${String(heures % 24).padStart(2, '0')} h`;
}

/**
 * La cellule « Attente » d'une course.
 *
 * @param depuis    horodatage de reception de la course chez nous (`createdAt`).
 * @param enAttente la course n'a toujours pas de livreur. Une course deja assignee
 *                  n'attend plus personne : sa duree reste lisible, mais elle
 *                  n'appelle aucun geste et ne prend donc aucune teinte.
 */
export function AttenteCourse({ depuis, enAttente }: { depuis?: null | string; enAttente: boolean }) {
    const minutes = minutesDAttente(depuis);

    if (minutes === null) {
        return <span className="text-muted">—</span>;
    }

    const aRelancer = enAttente && minutes >= SEUIL_RELANCE_MINUTES;

    /*
     * Au-dela d'une journee, la duree ne suffit plus.
     *
     * <p>« 3 j 07 h » ne dit pas QUAND la course est arrivee, et c'est ce qu'on demande au
     * telephone. L'ancienne carte basculait donc en date absolue passe vingt-quatre heures.
     * Une version precedente a range cette date dans un attribut `title` : elle n'apparait
     * qu'au survol, donc jamais au doigt, c'est-a-dire jamais sur la vue en cartes que
     * l'operateur a demande de garder sur mobile. Elle est de nouveau ECRITE.</p>
     */
    const ancienne = minutes >= 24 * 60;

    return (
        <span
            className={[
                'flex flex-col',
                aRelancer ? 'font-semibold text-warning-soft-foreground' : 'text-foreground',
            ].join(' ')}
        >
            <span className="tabular-nums">{dureeCourte(minutes)}</span>
            {ancienne && depuis ? (
                <span className="text-xs font-normal tabular-nums text-muted">
                    {dayjs(depuis).format('DD/MM/YYYY à HH:mm')}
                </span>
            ) : null}
        </span>
    );
}
