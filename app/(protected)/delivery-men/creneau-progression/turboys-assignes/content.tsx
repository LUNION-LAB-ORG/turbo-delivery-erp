'use client';

/*
 * Progression des turboys assignes, etablissement par etablissement.
 *
 * <h3>Ce qu'on vient chercher ici</h3>
 * <p>La ligne de tete comptait des etablissements et des turboys : deux inventaires,
 * aucune reponse. Un superviseur ouvre cet ecran pour savoir QUI DECROCHE, et ce nombre
 * n'existait que bloc par bloc, ce qui obligeait a derouler dix tableaux pour savoir si
 * la page contenait un probleme. Il est agrege en tete, et le volume passe derriere lui,
 * sans rien perdre : les trois nombres d'origine sont toujours a l'ecran.</p>
 *
 * <h3>L'ordre de lecture etait inverse</h3>
 * <p>L'ecran s'ouvrait sur sa PAGINATION : la premiere chose que l'oeil rencontrait etait
 * « Precedent / Page 1 / 4 / Suivant », avant le moindre nom d'etablissement. La meme
 * barre etait recopiee a l'identique en pied de page. Un ecran de supervision se lit
 * d'abord et se parcourt ensuite : la liste passe devant, et le seul geste de la page,
 * changer de page, tient en une barre unique, en bas, la ou le regard finit.</p>
 *
 * <p>Ce que la barre du haut compensait vraiment, c'etait l'atterrissage : on cliquait
 * « Suivant » tout en bas et on arrivait au bas d'une page neuve, donc a la fin d'une
 * liste qu'on n'avait pas lue. Le retour en haut est fait ici, ce qui retire a la barre
 * du haut sa derniere raison d'exister.</p>
 *
 * <h3>L'echec se produit en bas, il se dit en bas</h3>
 * <p>Un changement de page qui echouait ne produisait RIEN : la promesse rejetee n'etait
 * rattrapee nulle part, l'ecran restait sur l'ancienne page, et l'operateur en concluait
 * qu'il avait mal clique. Une premiere reparation avait mis le bandeau d'echec en TETE de
 * liste, alors que le seul declencheur de chargement est la pagination, en PIED : on
 * cliquait en bas, rien ne bougeait, et l'explication etait plusieurs milliers de pixels
 * plus haut. Le bandeau est desormais contre la pagination, la ou le geste a lieu, et il
 * porte `role="alert"` pour etre annonce.</p>
 *
 * <p>Il dit aussi QUELLE page a echoue et y retourne. Sa relance rechargeait la page
 * COURANTE, celle deja affichee : la requete partait, elle reussissait, le bandeau
 * disparaissait, et l'operateur restait ou il etait en croyant avoir avance. Le numero
 * demande est memorise, et le libelle le nomme, au lieu de parler de « la page suivante »
 * meme quand on avait clique « Precedent ».</p>
 *
 * <p>Un chargement en cours ne se voyait pas davantage, et rien n'empechait d'empiler
 * deux lectures en cliquant deux fois. Le garde est en place, mais il avalait le second
 * clic en silence : la barre de pagination s'attenue et cesse de repondre pendant une
 * lecture, et une ligne dit ce qui se passe. SIGNALEMENT : `PaginationTableau` est
 * PARTAGE et n'expose ni `isDisabled` ni `isPending` ; l'attenuation locale est un
 * pis-aller, la vraie place de cet etat est dans le composant de pagination.</p>
 *
 * <p>Une page vide remplacait TOUT l'ecran, pagination comprise. Arrive sur une page sans
 * etablissement, on ne pouvait plus revenir en arriere : la seule sortie etait de
 * recharger l'onglet. Le cadre de la liste survit desormais au vide.</p>
 *
 * <h3>Ce que le serveur envoyait et qu'on jetait</h3>
 * <p>`totalElements` etait lu a chaque requete et n'apparaissait nulle part : on savait
 * « page 1 sur 4 », jamais combien d'etablissements cela representait. Il est a l'ecran.</p>
 *
 * <p>Le nombre de turboys d'un etablissement vient du tableau REELLEMENT affiche, pas du
 * champ `nombreLivreur` que porte la reponse : les deux peuvent diverger, et un en-tete
 * qui annonce huit coursiers au-dessus de trois lignes n'a aucun moyen de s'expliquer.</p>
 *
 * <h3>Ce qui a ete retire, et pourquoi</h3>
 * <p>L'ANNEAU de l'avatar d'etablissement, et sa taille de 40 px, ramenee a 36. Purement
 * cosmetique, aucune donnee touchee : l'anneau ajoutait un trait autour de chaque logo
 * sur un ecran ou rien n'appelle un geste, et 36 px est la taille de l'avatar de coursier
 * rendu juste en dessous par la cellule partagee. Les deux colonnes d'avatars de la page
 * s'alignent donc au lieu de se decaler de 4 px.</p>
 *
 * <p>Le resume « Page 1 / 1 » quand il n'y a qu'une seule page. `PaginationTableau` se
 * retire deja lui-meme sous deux pages ; la garde ci-dessous ne fait qu'eviter, en plus,
 * l'intervalle vide qu'une enveloppe rendue laisserait en pied de liste. L'information
 * perdue est nulle, la ligne de situation dit deja sur quoi l'on travaille.</p>
 *
 * <p>Rien d'autre. Verification faite champ par champ : nom d'etablissement, logo, nombre
 * de turboys du bloc, nom de coursier, avatar, barre de progression et son pourcentage,
 * jours travailles sur sept, dates de debut et de fin du creneau, position dans la
 * pagination et total d'elements sont tous a l'ecran.</p>
 */

import { Avatar, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import React, { useState } from 'react';

import EmptyDataTable from '@/components/commons/EmptyDataTable';
import EtatErreur from '@/components/commons/EtatErreur';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { getAllCreneauPerformanceTurbo } from '@/src/creneau-livreur/creneau-livreur.action';
import { PaginatedResponse } from '@/types';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

import TableCreneau, { OrdreCoursiers, SEUIL_RETARD } from './tableCreneau';

/**
 * Les deux ordres de lecture proposes. Le tri par progression repond a la question de
 * l'ecran, il reste le defaut ; le tri par nom sert quand un nom vient d'ailleurs, par
 * telephone le plus souvent, et que le tableau n'offre aucune colonne triable.
 */
const ORDRES: { id: OrdreCoursiers; libelle: string }[] = [
    { id: 'retard', libelle: "Retard d'abord" },
    { id: 'nom', libelle: 'Nom' },
];

interface Props {
    initialData: PaginatedResponse<RestaurantProgressionTurbo> | null;
}

export default function Content({ initialData }: Props) {
    const [page, setPage] = useState(initialData?.number ?? 0);
    const [data, setData] = useState(initialData);
    const [enCours, setEnCours] = useState(false);
    // On retient le NUMERO de la page qui a echoue, pas un simple booleen : sans lui, la
    // relance ne peut que recharger la page courante, c'est-a-dire celle qui est deja a
    // l'ecran, et un echec non resolu passe pour un succes.
    const [pageEchouee, setPageEchouee] = useState<null | number>(null);
    const [ordre, setOrdre] = useState<OrdreCoursiers>('retard');

    /**
     * Une seule lecture a la fois : sans ce garde, deux clics rapides lancaient deux
     * requetes dont la plus lente ecrasait la plus rapide, et l'ecran finissait sur une
     * page que personne n'avait demandee.
     */
    const charger = async (cible: number) => {
        if (enCours) return;

        setEnCours(true);
        setPageEchouee(null);
        try {
            const reponse = await getAllCreneauPerformanceTurbo(cible);
            // `null` est un echec deguise cote action : le traiter comme une liste vide
            // ferait afficher « aucun etablissement » sur une panne de lecture.
            if (!reponse) {
                setPageEchouee(cible);
                return;
            }
            setData(reponse);
            setPage(cible);
            // On repart du haut de la liste : le clic est en bas, la lecture reprend en
            // haut. Sans cela on atterrit a la fin d'une page qu'on n'a pas lue.
            if (cible !== page) {
                window.scrollTo({ behavior: 'smooth', top: 0 });
            }
        } catch {
            setPageEchouee(cible);
        } finally {
            setEnCours(false);
        }
    };

    // Rien n'a jamais pu etre lu : il n'y a pas de liste a preserver, l'echec occupe
    // l'ecran et porte sa relance. Elle vise la page demandee si une l'a ete.
    if (!data) {
        return (
            <EtatErreur
                enCours={enCours}
                onReessayer={() => charger(pageEchouee ?? page)}
                quoi="la progression des turboys assignés"
            />
        );
    }

    const etablissements = data.content;
    const turboys = etablissements.reduce((total, e) => total + (e.livreurs?.length ?? 0), 0);
    // Le compte de decrochages de la page, avec le MEME seuil que les blocs, importe du
    // composant de bloc pour que les deux ne puissent pas diverger.
    const enRetard = etablissements.reduce(
        (total, e) =>
            total + (e.livreurs ?? []).filter((l) => (l.progression ?? 0) < SEUIL_RETARD).length,
        0,
    );

    return (
        <div className="flex flex-col gap-6">
            {/* Ce qu'on vient chercher d'abord, le retard, puis ce que pese la page.
                La position dans la pagination est dite par la pagination elle meme, en bas,
                et n'est pas repetee ici. Le choix d'ordre est pris ici, une fois, et
                s'applique a tous les blocs. */}
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                    <p className="text-sm text-foreground">
                        <span className="font-semibold tabular-nums">{enRetard}</span>{' '}
                        {enRetard > 1 ? 'turboys' : 'turboy'} sous{' '}
                        <span className="tabular-nums">{SEUIL_RETARD}</span>
                        &nbsp;% sur{' '}
                        <span className="font-semibold tabular-nums">{turboys}</span>{' '}
                        {turboys > 1 ? 'assignés' : 'assigné'}
                    </p>
                    <p className="text-xs text-muted">
                        <span className="tabular-nums">{etablissements.length}</span>{' '}
                        {etablissements.length > 1 ? 'établissements' : 'établissement'} sur cette
                        page, <span className="tabular-nums">{data.totalElements}</span> au total
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted">Ordre</span>
                    <ToggleButtonGroup
                        aria-label="Ordre des coursiers dans chaque établissement"
                        onSelectionChange={(selection) => {
                            const choisi = String(Array.from(selection)[0] ?? '');
                            // Un groupe en selection simple peut se retrouver vide si l'on
                            // reclique le bouton actif : l'ordre courant est alors conserve,
                            // faute de quoi la liste n'aurait plus d'ordre du tout.
                            if (choisi === 'nom' || choisi === 'retard') setOrdre(choisi);
                        }}
                        selectedKeys={new Set([ordre])}
                        selectionMode="single"
                        size="sm"
                    >
                        {ORDRES.map((o) => (
                            <ToggleButton id={o.id} key={o.id}>
                                {o.libelle}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </div>
            </div>

            <div
                aria-busy={enCours}
                className={`flex flex-col gap-4 transition-opacity ${enCours ? 'opacity-50' : ''}`}
            >
                {etablissements.length === 0 ? (
                    <EmptyDataTable
                        message="Aucun établissement n'a de turboy assigné sur cette page."
                        title="Aucun établissement"
                    />
                ) : (
                    // Le nom d'etablissement ne fait pas une cle : `RestaurantProgressionTurbo`
                    // ne porte aucun identifiant, et deux sites homonymes dans un meme groupe
                    // multi-sites donneraient une cle dupliquee, donc un avertissement React et
                    // une reconciliation capable d'afficher le tableau du premier sous le nom du
                    // second. L'index est le seul element unique dont on dispose.
                    etablissements.map((etablissement, index) => (
                        <section
                            className="rounded-lg border border-default-200"
                            key={`${index}-${etablissement.nomRestaurant}`}
                        >
                            {/* Le cadre du bloc rattache le tableau a SON etablissement : sans
                                lui, dix en-tetes et dix tableaux se suivent en colonne et rien
                                ne dit ou l'un finit et ou l'autre commence. En-tete et tableau
                                partagent le meme retrait horizontal, faute de quoi le nom part
                                a x=0 et son tableau a x=16. */}
                            <header className="flex items-center gap-3 border-b border-default-200 px-4 py-3">
                                {/* Le repli d'origine pointait « assets/images/avatar.png »
                                    sans barre oblique initiale : sur cette route le navigateur
                                    cherchait le fichier sous /delivery-men/creneau-progression/
                                    et recevait un 404, donc une image cassee par etablissement
                                    sans logo. Le fichier EXISTE pourtant bien dans le depot,
                                    a public/assets/images/avatar.png : ce qui etait faux, c'est
                                    le CHEMIN, pas l'image, et il n'y a rien a ajouter au depot.
                                    Les initiales ne peuvent pas casser, et distinguent les
                                    lignes mieux qu'une silhouette identique pour tous. */}
                                <Avatar className="size-9 shrink-0">
                                    {etablissement.logo && (
                                        <Avatar.Image
                                            alt=""
                                            src={createUrlFile(etablissement.logo, 'restaurant')}
                                        />
                                    )}
                                    <Avatar.Fallback>
                                        {getInitials(etablissement.nomRestaurant)}
                                    </Avatar.Fallback>
                                </Avatar>
                                {/* L'identite de la section, pas un titre de page : le nom
                                    d'etablissement etait rendu en h2 text-xl, dix fois de suite,
                                    ce qui donnait dix titres de meme poids que celui de l'ecran.
                                    Il situe le tableau, il ne le domine pas. */}
                                <div className="min-w-0">
                                    <h2 className="truncate text-base font-semibold text-foreground">
                                        {etablissement.nomRestaurant}
                                    </h2>
                                    <p className="text-xs text-muted">
                                        <span className="tabular-nums">
                                            {etablissement.livreurs?.length ?? 0}
                                        </span>{' '}
                                        {(etablissement.livreurs?.length ?? 0) > 1
                                            ? 'turboys assignés'
                                            : 'turboy assigné'}
                                    </p>
                                </div>
                            </header>

                            <TableCreneau
                                initialData={etablissement.livreurs}
                                nomEtablissement={etablissement.nomRestaurant}
                                ordre={ordre}
                            />
                        </section>
                    ))
                )}
            </div>

            {/* Le seul geste de l'ecran, et tout ce qui le concerne : ce qui a echoue, ce
                qui est en cours, ou l'on est. Le bloc survit a une page vide, sans quoi on
                reste bloque dessus. */}
            <div className="flex flex-col gap-3">
                {/* L'echec de changement de page ne remplace pas la liste : celle qui est
                    affichee reste valable, c'est la page DEMANDEE qui n'est pas arrivee. Il
                    est rendu ici, contre la pagination, parce que c'est la que le clic a eu
                    lieu ; en tete de liste il etait hors du champ de vision. */}
                {pageEchouee !== null && (
                    <div role="alert">
                        <EtatErreur
                            compact
                            enCours={enCours}
                            onReessayer={() => charger(pageEchouee)}
                            quoi={`la page ${pageEchouee + 1}`}
                        />
                    </div>
                )}

                {enCours && (
                    <p aria-live="polite" className="text-center text-xs text-muted">
                        Chargement de la page…
                    </p>
                )}

                {data.totalPages > 1 && (
                    <div
                        className={`flex justify-center transition-opacity ${
                            enCours ? 'pointer-events-none opacity-50' : ''
                        }`}
                    >
                        <PaginationTableau
                            onPage={(numero) => charger(numero - 1)}
                            page={page + 1}
                            total={data.totalPages}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
