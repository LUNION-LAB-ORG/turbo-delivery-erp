'use client';

/*
 * Les courses d'UN partenaire : /external_delivery/restaurant/{id}.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Il arrive ici depuis la carte journaliere du partenaire, qui vient de lui dire
 * « 3 en cours, 8 terminees ». Sa question en ouvrant la page est donc : laquelle de
 * ces courses attend encore quelqu'un, et depuis quand. Pas « quel est le code de la
 * premiere carte ».</p>
 *
 * <p>« Depuis quand » se lit maintenant : la colonne de creation donne d'abord l'ecart
 * au present, « il y a 12 min », et la date exacte dessous. Une date a la seconde ne se
 * compare pas d'une ligne a l'autre et l'ecart ne se calcule pas de tete ; la date reste
 * pourtant sous les yeux, entiere, parce qu'elle sert au rapprochement avec le
 * partenaire. Le calcul est celui de `timeAgo`, deja utilise par l'ecran de dispatch :
 * les deux ecrans disent l'anciennete de la meme facon.</p>
 *
 * <h3>Ce qui change</h3>
 * <p>C'etait une grille de cartes a deux colonnes. Chaque carte portait en pied le
 * logo, le nom et la commune du restaurant : le MEME sur les dix cartes, puisque la
 * page est deja filtree sur ce restaurant. Cette identite est maintenant l'en-tete de
 * la page, une fois, et la place gagnee sert a ce qui differe d'une ligne a l'autre.</p>
 *
 * <p>Ce qui differe d'une ligne a l'autre et se compare colonne par colonne, c'est un
 * tableau, pas une grille. Les montants s'alignent a droite en chasse tabulaire : on
 * voit d'un coup laquelle de ces courses pese le plus, ce qu'une pastille noire posee
 * au milieu d'une carte ne permettait pas. Sur telephone, `TableauResponsive` rend les
 * memes colonnes declarees une fois en cartes tactiles.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Une seule chose : une course EN_ATTENTE, qui n'a pas encore de livreur. Le geste
 * est sur la ligne, et plus seulement au troisieme rang d'un menu. Il y est TOUJOURS
 * aussi : `DeliveryTools` garde son entree « Assigner un livreur » sous exactement la
 * meme condition, et monte pour chaque ligne un second `DeliveryAssign`. C'est un
 * composant PARTAGE par trois ecrans, l'entree doit etre retiree la-bas, pas ici.</p>
 *
 * <p>« Voir le detail » a lui aussi son controle visible sur la ligne, comme sur les
 * cartes de dispatch. Sans lui, une page d'historique entierement terminee n'offrait
 * plus aucun controle : le seul present, « Assigner », ne s'affiche que sur les lignes
 * en attente.</p>
 *
 * <p>L'ecran disait l'inverse. Une course terminee recevait un cadre vert de 2 px, une
 * annulee un cadre rouge, le code passait au jaune ou au vert selon le statut, et la
 * pagination etait peinte en rouge de marque : le fini et le defait criaient plus fort
 * que la seule ligne qui attendait quelqu'un. Le vocabulaire des statuts est celui de
 * `course-statut.tsx`, deja partage par les deux autres ecrans de courses, qui ne
 * distingue que le fini et le defait.</p>
 */

import dayjs from 'dayjs';
import { Avatar, Button, Chip } from '@heroui-v3/react';
import { Eye, UserRoundPlus, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { useAbility } from '@/hooks/use-ability';
import { getPaginationCourseExterne } from '@/src/actions/courses.actions';
import { PaginatedResponse } from '@/types';
import { CourseExterne, LivreurDisponible, Restaurant } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';
import { timeAgo } from '../../component/course-card';
import { CourseStatutChip, fmtXof, montantCourse } from '../../component/course-statut';
import DeliveryAssign from '../../component/delivery-assign';
import DeliveryTools from '../../component/deliveryTools';

interface Props {
    initialData: PaginatedResponse<CourseExterne> | null;
    delivers: LivreurDisponible[];
    restaurantId: string;
}

export default function Content({ initialData, delivers, restaurantId }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [data, setData] = useState<PaginatedResponse<CourseExterne> | null>(initialData);
    // Une page absente ne peut pas venir d'un echec de lecture : l'action RELANCE
    // l'exception (`courses.actions.ts`) et `page.tsx` ne l'attrape pas, donc une panne
    // fait tomber la page serveur et `Content` n'est jamais rendu. Un `initialData` a
    // null vient d'une reponse resolue au corps vide, qui n'est pas non plus une liste
    // vide : une liste vide, c'est `content: []`. On ne peut rien afficher, on le dit
    // comme illisible et jamais comme « ce partenaire n'a envoye aucune course ».
    const [erreurLecture, setErreurLecture] = useState(!initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [courseAAssigner, setCourseAAssigner] = useState<CourseExterne | null>(null);

    const ability = useAbility();
    const canUpdate = ability.can('update', 'Commande');

    // La liste se DERIVE de la reponse. Elle etait recopiee dans un second etat
    // (`dataFilter`) que chaque lecture devait penser a remettre a jour : c'est ainsi
    // que deux sources de verite divergent. Memorisee, faute de quoi `data` a null rend
    // un tableau NEUF a chaque rendu et les mesures qui en dependent se recalculent.
    const courses = useMemo(() => data?.content ?? [], [data]);

    // L'ecran est deja filtre sur un partenaire : son identite est constante sur toutes
    // les lignes, elle se lit donc sur la premiere qui la porte. On la RETIENT ensuite :
    // derivee des lignes, elle s'effacait des que la page etait vide ou illisible, et le
    // titre retombait sur un libelle generique au moment precis ou l'operateur a besoin
    // de savoir chez quel partenaire il se trouve. Le correctif durable est une lecture
    // de l'etablissement dans `page.tsx`, qui connait deja `restaurantId`.
    const [partenaire, setPartenaire] = useState<Partial<Restaurant> | undefined>(
        () => initialData?.content?.find((c) => c.restaurant?.nomEtablissement)?.restaurant,
    );

    useEffect(() => {
        const lu = courses.find((c) => c.restaurant?.nomEtablissement)?.restaurant;
        if (!lu) return;
        // Le sondage des 15 s rend un objet neuf a chaque tour pour le meme partenaire :
        // sans cette comparaison, l'en-tete se redessinerait quatre fois par minute.
        setPartenaire((connu) => (connu?.nomEtablissement === lu.nomEtablissement ? connu : lu));
    }, [courses]);

    // Les courses de la page qui n'ont pas encore de livreur. C'est la seule mesure de
    // cet ecran qui appelle un geste, donc la seule qui merite une teinte et le son.
    const aAssigner = useMemo(
        () => courses.filter((c) => c.statut?.toUpperCase() === 'EN_ATTENTE').length,
        [courses],
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [sonAutorise, setSonAutorise] = useState(false);
    // Une alarme sans bouton d'arret n'offre qu'un moyen de se taire : assigner. Sur un
    // ecran d'historique, ou une course jamais assignee ni annulee peut rester la des
    // mois, cela revient a une boucle permanente que rien ne coupe.
    const [sonCoupe, setSonCoupe] = useState(false);

    // Un navigateur refuse de jouer un son avant la premiere interaction de l'operateur.
    useEffect(() => {
        const autoriser = () => {
            setSonAutorise(true);
            window.removeEventListener('click', autoriser);
            window.removeEventListener('keydown', autoriser);
        };
        window.addEventListener('click', autoriser);
        window.addEventListener('keydown', autoriser);
        return () => {
            window.removeEventListener('click', autoriser);
            window.removeEventListener('keydown', autoriser);
        };
    }, []);

    /*
     * L'alarme sonnait des que la page contenait UNE ligne, quel que soit son statut.
     * Sur cet ecran, qui liste l'historique complet d'un partenaire, elle hurlait donc
     * en boucle devant dix courses terminees le mois dernier. Une alarme qui sonne
     * toujours ne dit plus rien : elle ne sonne que pour ce qui attend un livreur,
     * comme sur l'ecran de dispatch, et la sourdine la coupe sans rien assigner.
     */
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (sonAutorise && !sonCoupe && aAssigner > 0) {
            audio.loop = true;
            // La V2 relancait `play()` a l'identique dans le `catch` : le second appel
            // etait refuse de la meme facon, sans gestionnaire cette fois.
            audio.play().catch(() => undefined);
        } else {
            audio.pause();
            audio.currentTime = 0;
        }
    }, [aAssigner, sonAutorise, sonCoupe]);

    const lire = useCallback(
        (page: number) => getPaginationCourseExterne(restaurantId, page - 1, pageSize),
        [pageSize, restaurantId],
    );

    const chargerPage = useCallback(
        async (page: number) => {
            setCurrentPage(page);
            setIsLoading(true);
            try {
                const reponse = await lire(page);
                setData(reponse);
                setErreurLecture(!reponse);
            } catch {
                setErreurLecture(true);
            } finally {
                setIsLoading(false);
            }
        },
        [lire],
    );

    // Rafraichissement silencieux : ni squelette, ni perte des lignes affichees.
    const rafraichir = useCallback(
        async (page: number) => {
            try {
                const reponse = await lire(page);
                setData(reponse);
                setErreurLecture(!reponse);
            } catch {
                setErreurLecture(true);
            }
        },
        [lire],
    );

    // Ce que l'effet de resynchronisation doit savoir au moment ou il se declenche, sans
    // que la page affichee entre dans ses dependances : elle changerait a chaque
    // pagination et relancerait une lecture que `chargerPage` vient de faire.
    const contexteLecture = useRef({ page: currentPage, rafraichir });
    useEffect(() => {
        contexteLecture.current = { page: currentPage, rafraichir };
    });

    /*
     * `initialData` est la PREMIERE page, rendue par le serveur. Un `router.refresh()`
     * la refait et nous rend un objet neuf : c'est ce que declenchent l'annulation d'une
     * course et l'assignation faite depuis le menu d'actions, qui ne passent pas par le
     * modal de cette page. L'etat `data` n'etait seme qu'au montage et ne suivait pas la
     * prop : la ligne restait affichee « En attente » et l'alarme continuait de sonner
     * jusqu'au sondage des 15 s, alors que le livreur etait deja assigne.
     */
    useEffect(() => {
        const { page, rafraichir: relire } = contexteLecture.current;
        if (page === 1) {
            setData(initialData);
            setErreurLecture(!initialData);
            return;
        }
        // Au-dela de la premiere page, `initialData` ne decrit pas ce qui est affiche.
        relire(page);
    }, [initialData]);

    useEffect(() => {
        const minuterie = setInterval(() => rafraichir(currentPage), 15000);
        return () => clearInterval(minuterie);
    }, [currentPage, rafraichir]);

    // Les replis de valeur absente et les acces optionnels portent sur des champs que
    // `types/models.ts` declare NON optionnels. Ce type est une declaration ecrite a la
    // main et rien ne valide la reponse HTTP a l'execution : c'est le type qui promet,
    // pas le backend. Les replis restent donc, et c'est le type qu'il faut rendre
    // honnete, dans un fichier qui n'est pas celui-ci.
    const colonnes: ColonneResponsive<CourseExterne>[] = useMemo(
        () => [
            {
                cle: 'code',
                identite: true,
                libelle: 'Code',
                // Le prefixe « Code: » repetait l'en-tete de sa propre colonne.
                rendu: (course) => (
                    <span className="font-mono text-sm font-semibold text-foreground">
                        {course.code ?? '—'}
                    </span>
                ),
            },
            {
                cle: 'creation',
                libelle: 'Créé le',
                // L'ecart au present d'abord, il repond a la question posee ; la date
                // exacte dessous, elle sert au rapprochement avec le partenaire. Un
                // `span` et pas un `div` : sur mobile la cellule est rendue DANS un
                // `span`, et un bloc dedans est un balisage invalide.
                rendu: (course) => (
                    <span className="flex flex-col leading-tight">
                        <span className="text-sm text-foreground">{timeAgo(course.createdAt)}</span>
                        <span className="text-xs tabular-nums text-muted">
                            {course.createdAt
                                ? dayjs(course.createdAt).format('DD/MM/YYYY HH:mm:ss')
                                : '—'}
                        </span>
                    </span>
                ),
            },
            {
                cle: 'commandes',
                libelle: 'Commandes',
                nombre: true,
                // Le mot « commande » a cote du chiffre repetait l'en-tete de la colonne.
                rendu: (course) => <span>{course.nombreCommande ?? course.commandes?.length ?? 0}</span>,
            },
            {
                cle: 'montant',
                libelle: 'Montant',
                nombre: true,
                rendu: (course) => (
                    <span className="font-semibold text-foreground">
                        {fmtXof(montantCourse(course.commandes))}
                    </span>
                ),
            },
            {
                cle: 'statut',
                libelle: 'Statut',
                rendu: (course) => <CourseStatutChip statut={course.statut} />,
            },
            {
                cle: 'actions',
                actions: true,
                libelle: 'Actions',
                // Les gestes s'alignent a GAUCHE. `TableauResponsive` ne pose `text-right`
                // sur l'en-tete que pour les colonnes de chiffres : pousser le contenu a
                // droite le decalait de son propre libelle, et sur les cartes tactiles le
                // conteneur n'etire pas son enfant, ou cela ne produisait donc rien.
                rendu: (course) => (
                    <div className="flex flex-wrap items-center gap-2">
                        {canUpdate && course.statut?.toUpperCase() === 'EN_ATTENTE' ? (
                            <Button onPress={() => setCourseAAssigner(course)} size="sm" variant="primary">
                                <UserRoundPlus aria-hidden="true" className="size-4" />
                                Assigner
                            </Button>
                        ) : null}
                        <LienBouton href={`/external_delivery/${course.id}`} taille="sm" variante="outline">
                            <Eye aria-hidden="true" className="size-4" />
                            Détail
                        </LienBouton>
                        <DeliveryTools delivery={course} delivers={delivers} />
                    </div>
                ),
            },
        ],
        [canUpdate, delivers],
    );

    const nomPartenaire = partenaire?.nomEtablissement;
    const total = data?.totalElements ?? 0;
    const echecTotal = erreurLecture && courses.length === 0;

    return (
        <div className="flex w-full flex-col gap-5 pb-10">
            <audio preload="auto" ref={audioRef} src="/assets/sounds/notification.wav" />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    {nomPartenaire && (
                        <Avatar size="md">
                            <Avatar.Image
                                alt=""
                                src={partenaire?.logo ? createUrlFile(partenaire.logo, 'restaurant') : undefined}
                            />
                            <Avatar.Fallback>{nomPartenaire.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                        </Avatar>
                    )}
                    <div className="min-w-0">
                        <h1 className="truncate text-xl font-semibold text-foreground">
                            {nomPartenaire ?? 'Courses du partenaire'}
                        </h1>
                        <p className="truncate text-sm text-muted">
                            Toutes les courses du canal intégration
                            {partenaire?.commune ? ` · ${partenaire.commune}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* La sourdine est visible en permanence : un controle qui n'apparait
                        qu'une fois le bruit commence se cherche pendant qu'il sonne. */}
                    <Button
                        aria-label={sonCoupe ? "Réactiver l'alarme sonore" : "Couper l'alarme sonore"}
                        isIconOnly
                        onPress={() => setSonCoupe((coupe) => !coupe)}
                        size="sm"
                        variant="ghost"
                    >
                        {sonCoupe ? (
                            <VolumeX aria-hidden="true" className="size-4" />
                        ) : (
                            <Volume2 aria-hidden="true" className="size-4" />
                        )}
                    </Button>
                    {/* L'ambre ne dit qu'une chose ici : du travail attend quelqu'un. */}
                    {aAssigner > 0 && (
                        <Chip color="warning" size="sm" variant="soft">
                            <Chip.Label>{aAssigner} à assigner sur cette page</Chip.Label>
                        </Chip>
                    )}
                    {/* Le compteur se tait sur un echec : « 0 course » se lit comme un
                        partenaire qui n'en a jamais envoye. */}
                    {!echecTotal && (
                        <Chip size="sm" variant="soft">
                            <Chip.Label>
                                {total} course{total > 1 ? 's' : ''}
                            </Chip.Label>
                        </Chip>
                    )}
                </div>
            </div>

            {/* Le rafraichissement des 15 s peut echouer alors que des lignes sont deja
                a l'ecran : sans cette ligne, l'operateur lit des donnees figees en
                croyant les voir se mettre a jour. */}
            {erreurLecture && courses.length > 0 && (
                <EtatErreur
                    compact
                    enCours={isLoading}
                    onReessayer={() => chargerPage(currentPage)}
                    quoi="les courses de ce partenaire"
                />
            )}

            <TableauResponsive
                cleLigne={(course) => course.id}
                colonnes={colonnes}
                enChargement={isLoading}
                enCoursDeRelance={isLoading}
                erreur={echecTotal}
                libelle={nomPartenaire ? `Courses de ${nomPartenaire}` : 'Courses du partenaire'}
                lignes={courses}
                onReessayer={() => chargerPage(currentPage)}
                quoi="les courses de ce partenaire"
                vide="Ce partenaire n'a envoyé aucune course."
            />

            {/* `PaginationTableau` se tait deja sous deux pages : ce garde ne le redit
                pas, il evite l'enveloppe vide que le `gap-5` du parent espacerait quand
                meme sous le tableau. */}
            {(data?.totalPages ?? 0) > 1 && (
                <div className="flex w-full justify-center">
                    <PaginationTableau onPage={chargerPage} page={currentPage} total={data?.totalPages ?? 1} />
                </div>
            )}

            {courseAAssigner && (
                <DeliveryAssign
                    delivers={delivers}
                    delivery={courseAAssigner}
                    onAssigned={() => rafraichir(currentPage)}
                    open={Boolean(courseAAssigner)}
                    setOpen={(ouvert) => {
                        if (!ouvert) setCourseAAssigner(null);
                    }}
                />
            )}
        </div>
    );
}
