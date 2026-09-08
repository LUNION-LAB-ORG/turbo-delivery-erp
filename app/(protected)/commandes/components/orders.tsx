'use client';

import { Button, Chip, Modal, Separator } from '@heroui-v3/react';
import { CheckCircle2, Clock, Eye, RotateCcw, ShoppingBag, XCircle } from 'lucide-react';
import React from 'react';
import type { DateRange } from 'react-day-picker';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import { ChampListe } from '@/components/commons/champs-formulaire';
import { TableauResponsive, type ColonneResponsive } from '@/components/commons/TableauResponsive';
import DateFilterInput from '@/components/finance/date-filter-input';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';
import { useOuverture } from '@/hooks/use-ouverture';
import { getAllOrders, getOrdersStats } from '@/src/actions/commandes.actions';
import { Order, OrderStats, OrderStatsItem, PageResponse, Restaurant } from '@/types/models';
import { formatMontant, formatNombre } from '@/utils/format.utils';

/**
 * Les commandes clients : ce qui a ete commande, chez qui, pour combien, et ou ca en est.
 *
 * <h3>Ce que l'operateur cherche ici</h3>
 * <p>Il arrive avec une question de volume (« combien de commandes aujourd'hui, pour quel
 * montant ») ou avec une question de piste (« la commande 4312, elle est ou »). Les deux
 * demandent de COMPARER : des montants entre eux, un etat a cote d'un autre. L'ecran
 * d'origine rendait la comparaison impossible.</p>
 *
 * <h3>Ce qui change</h3>
 * <p>Les commandes etaient une grille de deux cartes de large. Chaque carte placait son
 * montant a une abscisse differente, selon la longueur de l'adresse au-dessus : dix
 * montants a l'ecran, dix positions, aucun alignement. Un total de commande n'est pas une
 * vignette, c'est une COLONNE. La liste devient un tableau, chiffres a chasse tabulaire et
 * alignes a droite, qui redevient des cartes sur telephone par `TableauResponsive`, ou les
 * colonnes ne sont declarees qu'une fois.</p>
 *
 * <p>L'etat de la commande n'etait ECRIT NULLE PART dans la liste : il n'existait que sous
 * forme d'une teinte de bordure autour de la carte. Un operateur daltonien ne le lisait
 * pas, un operateur presse le confondait, et personne ne savait dire ce que valait le
 * jaune sans ouvrir le detail. Il est maintenant une colonne, en toutes lettres.</p>
 *
 * <p>Les couleurs de cette teinte venaient de la palette Tailwind brute
 * (`bg-yellow-50 text-yellow-800 border-yellow-400`), sans equivalent sombre. Ne subsiste
 * qu'une seule couleur, et elle dit une seule chose : ANNULEE. « En cours » et
 * « Terminee » sont le deroulement normal ; les peindre reviendrait a colorier une
 * categorie, et sept teintes qui informent chacune d'un fait ordinaire n'informent de
 * rien. Le mot suffit, et il se lit.</p>
 *
 * <h3>Ce qui a ete retire, et pourquoi c'etait faux</h3>
 * <ul>
 *   <li>La pastille d'identite en tete de carte affichait `id.slice(0, 4)` : quatre
 *       caracteres d'un UUID, en capitales, a la place d'un code. Ca ressemblait a une
 *       reference opposable, ce n'en etait pas une, et la vraie reference (le numero de
 *       commande) etait ecrite juste a cote.</li>
 *   <li>La fenetre de detail titrait « Détails commande #{id.slice(0, 8)} » quand la
 *       liste, elle, titrait « Commande #{numero} ». Deux identifiants pour un meme objet,
 *       impossibles a rapprocher a l'oeil. La fiche porte desormais le NUMERO, et l'UUID
 *       complet reste en dessous, annonce pour ce qu'il est.</li>
 *   <li>Chaque ligne d'article portait un carre gris de 64 px contenant le mot « Img ».
 *       Il n'existe aucun champ d'image sur `OrderItem` : ce cadre promettait une photo
 *       qui n'arriverait jamais.</li>
 *   <li>Le nom de l'article etait fabrique : `Produit ${platId.slice(0, 6)}`. Le service
 *       ne renvoie pas le libelle du plat, seulement son identifiant ; l'ecran inventait
 *       donc un nom de produit a partir d'un fragment d'UUID. La reference est conservee,
 *       mais annoncee comme une reference, et RIEN ne la remplace a la place du nom : un
 *       libelle constant (« Article ») sous un en-tete qui dit deja « Articles (n) » se
 *       repete a chaque ligne sans rien ajouter a la quantite ni au prix.</li>
 * </ul>
 *
 * <h3>Ce qui manquait</h3>
 * <p>Une fois un restaurant choisi, il n'existait AUCUN moyen de revenir a l'ensemble des
 * commandes : la liste n'avait pas d'entree « tous », et il fallait recharger la page. Il
 * en allait de meme pour la periode. Un retour a zero apparait des qu'un filtre est pose.</p>
 *
 * <p>La liste n'avait ni etat vide ni etat de chargement : une reponse sans contenu
 * affichait une zone blanche muette, et un changement de filtre ne montrait rien pendant
 * la lecture.</p>
 */

/** Taille de page du service. Le 10 etait ecrit en dur dans les QUATRE appels. */
const TAILLE_PAGE = 10;

/** Cle de l'entree « tous les partenaires », qui n'existait pas. */
const TOUS = '__tous__';

/**
 * Les etats de commande, en clair.
 *
 * <p>Le service renvoie l'enum brute (`PENDING`), que l'ecran affichait telle quelle dans
 * la fenetre de detail. Une valeur inconnue reste affichee brute plutot que masquee : mieux
 * vaut un libelle technique a l'ecran qu'un etat qui disparait.</p>
 */
const ETATS: Record<string, { couleur?: 'danger'; libelle: string }> = {
    CANCELLED: { couleur: 'danger', libelle: 'Annulée' },
    COMPLETED: { libelle: 'Terminée' },
    PENDING: { libelle: 'En cours' },
};

/**
 * `orderState` est declare `string` par le type, mais la charge utile de production ne
 * s'y engage pas : le champ arrive vide sur des commandes anciennes. Une pastille sans
 * texte est alors rendue — un rectangle gris muet, qu'on ne peut ni lire ni interroger.
 * Un etat absent se dit avec le meme tiret que les autres cellules de l'ecran ; seule
 * une valeur REELLEMENT presente merite une pastille, connue ou non.
 */
function EtatCommande({ etat }: { etat: null | string | undefined }) {
    const brut = etat?.trim();
    if (!brut) return <span className="text-muted">—</span>;

    const connu = ETATS[brut];
    return (
        <Chip color={connu?.couleur} size="sm" variant="soft">
            <Chip.Label>{connu?.libelle ?? brut}</Chip.Label>
        </Chip>
    );
}

/**
 * Une date vers le `yyyy-MM-dd` attendu par le service.
 *
 * <p>Les quatre chargements construisaient un `new Date(annee, mois - 1, jour)` puis
 * appelaient `toISOString()`. Cette conversion bascule en temps UNIVERSEL : sous un fuseau
 * negatif, minuit local du 3 devient le 2 a 23 h, et la borne partait au service decalee
 * d'un jour. On lit donc l'annee, le mois et le jour LOCAUX, ceux-la memes que
 * l'operateur a choisis dans le calendrier.</p>
 */
function borne(date: Date | undefined): null | string {
    if (!date) return null;
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${mois}-${jour}`;
}

/** La periode retenue. Vide tant qu'aucune borne n'est posee. */
type Plage = { debut?: Date; fin?: Date };

type OrdersProps = {
    commandesInitiales: PageResponse<Order> | null;
    /** Le serveur n'a rien pu lire : on demarre sur l'echec, pas sur une liste vide. */
    erreurInitiale?: boolean;
    restaurants: Restaurant[];
    stats: OrderStats | null;
};

export default function OrdersPage({ commandesInitiales, erreurInitiale = false, restaurants, stats }: OrdersProps) {
    const [commandes, setCommandes] = React.useState<PageResponse<Order> | null>(commandesInitiales);
    const [orderStats, setOrderStats] = React.useState<OrderStats | null>(stats);
    const [enChargement, setEnChargement] = React.useState(false);
    // Deux chargements distincts, parce qu'ils ne portent pas sur la meme chose : passer a
    // la page suivante ne change RIEN aux quatre mesures du bandeau. Un indicateur unique
    // les faisait clignoter a chaque « suivant », comme si les chiffres bougeaient.
    const [statsEnChargement, setStatsEnChargement] = React.useState(false);
    // L'echec de lecture a son propre etat : sans lui, l'ecran garde la liste precedente
    // ou reste vide, ce qui se lit comme "il n'y a aucune commande" alors que la donnee
    // existe et n'a pas pu etre lue.
    const [erreur, setErreur] = React.useState(erreurInitiale);

    const [partenaire, setPartenaire] = React.useState<string>(TOUS);
    const [plage, setPlage] = React.useState<Plage>({});

    const fiche = useOuverture();
    // La commande n'est pas effacee a la fermeture : la fenetre s'anime en sortant, et la
    // vider tout de suite faisait clignoter une fiche blanche pendant la disparition.
    const [commandeDetail, setCommandeDetail] = React.useState<Order | null>(null);

    /**
     * Un compteur de requetes : seule la DERNIERE reponse a le droit de peindre.
     *
     * <p>Quatre chargeurs independants ecrivaient dans le meme etat sans se coordonner.
     * Changer de partenaire puis de periode plus vite que le reseau laissait la reponse la
     * plus lente ecraser la plus recente : la liste affichait alors le resultat d'un filtre
     * que plus rien a l'ecran n'indiquait.</p>
     */
    const sequence = React.useRef(0);

    React.useEffect(() => {
        setCommandes(commandesInitiales);
        // Une charge serveur REUSSIE efface l'echec precedent, sinon l'ecran resterait
        // sur l'erreur alors que la donnee est de nouveau la. Une charge qui a echoue,
        // elle, doit garder l'echec : le remettre a faux ferait passer une lecture
        // impossible pour une liste vide.
        setErreur(commandesInitiales === null);
    }, [commandesInitiales]);

    /**
     * Le chargeur unique de l'ecran.
     *
     * <p>Il y en avait quatre, qui recopiaient chacun la meme conversion de dates et se
     * repartissaient les etats a mettre a jour de facon differente : la pagination
     * n'affichait aucun chargement, les deux filtres n'en affichaient pas non plus, et
     * seul le reessai touchait aux statistiques. Les statistiques ne dependent pas de la
     * page : `avecStats` evite de les relire a chaque « suivant ».</p>
     *
     * <p>L'echec n'est efface qu'au SUCCES, jamais a l'entree. Le remettre a zero avant
     * l'attente demontait `EtatErreur` des le clic sur « Reessayer » : son indicateur de
     * relance ne s'affichait donc jamais, et l'ecran passait par un etat vide muet avant
     * de savoir si la lecture avait abouti.</p>
     */
    const charger = React.useCallback(
        async (page: number, filtrePartenaire: string, filtrePlage: Plage, avecStats: boolean) => {
            const rang = sequence.current + 1;
            sequence.current = rang;

            const restaurantId = filtrePartenaire === TOUS ? null : filtrePartenaire;
            const debut = borne(filtrePlage.debut);
            const fin = borne(filtrePlage.fin);

            setEnChargement(true);
            if (avecStats) setStatsEnChargement(true);
            try {
                const [liste, mesures] = await Promise.all([
                    getAllOrders(page, TAILLE_PAGE, restaurantId, debut, fin),
                    avecStats ? getOrdersStats(restaurantId, debut, fin) : Promise.resolve(undefined),
                ]);

                if (sequence.current !== rang) return;
                if (liste) setCommandes(liste);
                if (mesures !== undefined) setOrderStats(mesures);
                setErreur(false);
            } catch (error) {
                if (sequence.current !== rang) return;
                console.error('Erreur lors du chargement des commandes', error);
                setErreur(true);
            } finally {
                if (sequence.current === rang) {
                    setEnChargement(false);
                    setStatsEnChargement(false);
                }
            }
        },
        [],
    );

    const pageCourante = commandes?.number ?? 0;
    const totalPages = commandes?.totalPages ?? 1;

    /**
     * Le changement de page.
     *
     * <p>Les deux boutons d'origine portaient `disabled={... || loadingPage}` : pendant une
     * lecture, on ne pouvait plus cliquer. `PaginationTableau` n'expose aucune prop
     * d'inactivite, et `pageCourante` est lue sur la REPONSE, donc elle reste perimee tant
     * que celle-ci n'est pas revenue : trois clics rapides sur « suivant » lancaient trois
     * requetes pour la meme page suivante. Le compteur de sequence empeche l'affichage
     * faux, il n'empeche pas les requetes ; ce garde-la si.</p>
     */
    const allerAPage = (page: number) => {
        if (enChargement) return;
        if (page < 0 || page >= totalPages || page === pageCourante) return;
        void charger(page, partenaire, plage, false);
    };

    const choisirPartenaire = (valeur: string) => {
        const cle = valeur || TOUS;
        setPartenaire(cle);
        void charger(0, cle, plage, true);
    };

    // Le selecteur ne rend une periode que lorsque ses DEUX bornes sont posees ; une
    // borne retiree remet la periode a vide, ce qui est le geste de retour a tout.
    const choisirPlage = (valeur: DateRange | undefined) => {
        const suivante: Plage = { debut: valeur?.from, fin: valeur?.to };
        setPlage(suivante);
        void charger(0, partenaire, suivante, true);
    };

    const reinitialiser = () => {
        setPartenaire(TOUS);
        setPlage({});
        void charger(0, TOUS, {}, true);
    };

    // Le reessai rejoue commandes ET statistiques avec les filtres courants : ne recharger
    // que les commandes laisserait les cartes sur la periode ou le partenaire precedents.
    const reessayer = () => void charger(pageCourante, partenaire, plage, true);

    const filtreActif = partenaire !== TOUS || plage.debut != null || plage.fin != null;

    /**
     * Les partenaires, ordonnes par nom.
     *
     * <p>La liste arrivait dans l'ordre du service, qui n'en est pas un pour l'oeil.</p>
     */
    const optionsPartenaires = React.useMemo(
        () => [
            { label: 'Tous les partenaires', value: TOUS },
            ...restaurants
                .map((r) => ({ label: r.nomEtablissement ?? '', value: r.id }))
                .sort((a, b) => a.label.localeCompare(b.label, 'fr')),
        ],
        [restaurants],
    );

    const ouvrirFiche = (commande: Order) => {
        setCommandeDetail(commande);
        fiche.onOpen();
    };

    /**
     * Les colonnes, declarees une fois pour le tableau ET pour les cartes tactiles.
     *
     * <p>Toute donnee que portait la carte d'origine est ici : numero, date, adresse, mode
     * de paiement, nombre d'articles, frais de livraison, total. L'etat, lui, s'y ajoute :
     * il n'etait qu'une couleur de bordure.</p>
     *
     * <h3>L'ordre, et pourquoi il compte ici</h3>
     * <p>Huit colonnes ne tiennent pas dans la fenetre d'un poste (environ 1000 px, coquille
     * de navigation comprise) : le tableau defile donc lateralement, et ce qui est place a
     * droite sort du champ. L'ETAT est la reparation principale de cet ecran ; le laisser en
     * avant-derniere position en faisait la premiere colonne a disparaitre. Il passe juste
     * apres l'identite de la commande, avant les montants. L'adresse, la plus large, est
     * bornee plus court — elle reste entiere au survol et sur la carte tactile. Et
     * l'en-tete « Frais de livraison » se dit « Frais » : le mot « livraison » est deja
     * dans la colonne voisine, et l'en-tete faisait a lui seul la largeur de sa colonne.</p>
     */
    const colonnes: ColonneResponsive<Order>[] = [
        {
            cle: 'commande',
            identite: true,
            libelle: 'Commande',
            rendu: (c) => (
                <div className="min-w-0">
                    <div className="truncate font-semibold text-foreground">Commande #{c.numero}</div>
                    <div className="truncate text-xs text-muted">
                        {c.dateCreation ? new Date(c.dateCreation).toLocaleString('fr-FR') : '—'}
                    </div>
                </div>
            ),
        },
        {
            cle: 'etat',
            libelle: 'État',
            rendu: (c) => <EtatCommande etat={c.orderState} />,
        },
        {
            cle: 'livraison',
            libelle: 'Livraison',
            rendu: (c) => (
                // Mesure faite : a 1000 px de fenetre, le tableau dispose de 928 px et les
                // huit colonnes en demandaient 976, dont 240 pour cette seule adresse. Le
                // trop-plein sortait par la droite, et c'est le bouton de detail qui
                // passait hors champ a chaque ligne. L'adresse est donc bornee sur poste —
                // elle reste entiere au survol, sur la fiche et sur la carte tactile, ou
                // aucune borne ne s'applique — et retrouve sa largeur sur un grand ecran,
                // le seul ou la place existe une fois les 280 px du menu deduits.
                <span
                    className="block max-w-full truncate md:max-w-[9rem] 2xl:max-w-[18rem]"
                    title={c.adresseM?.libelle ?? undefined}
                >
                    {c.adresseM?.libelle ?? 'Adresse inconnue'}
                </span>
            ),
        },
        {
            cle: 'paiement',
            libelle: 'Paiement',
            rendu: (c) => c.paymentMethod ?? '—',
        },
        {
            cle: 'articles',
            libelle: 'Articles',
            nombre: true,
            rendu: (c) => c.orderItemM?.length ?? 0,
        },
        {
            cle: 'frais',
            libelle: 'Frais',
            nombre: true,
            rendu: (c) => formatMontant(c.deliveryFee ?? 0),
        },
        {
            cle: 'total',
            libelle: 'Total',
            nombre: true,
            rendu: (c) => (
                <span className="font-semibold text-foreground">{formatMontant(c.totalAmount ?? 0)}</span>
            ),
        },
        {
            actions: true,
            cle: 'detail',
            libelle: 'Détail',
            rendu: (c) => (
                <Button
                    aria-label={`Voir le détail de la commande ${c.numero}`}
                    isIconOnly
                    onPress={() => ouvrirFiche(c)}
                    size="sm"
                    variant="ghost"
                >
                    <Eye aria-hidden="true" className="size-4" />
                </Button>
            ),
        },
    ];

    /**
     * Les quatre mesures du bandeau.
     *
     * <p>Le libelle du deuxieme etat disait « ACCEPTEE » pour la cle `completed` : une
     * commande terminee n'est pas une commande acceptee, et les deux mots designent deux
     * moments differents du parcours. Le libelle suit desormais la cle.</p>
     *
     * <p>Le chiffre reste le NOMBRE, le montant passe en note : c'est le volume qu'on
     * compare d'un coup d'oeil, et un montant seul ne dit pas combien de commandes il
     * recouvre. La part est calculee sur les nombres affiches juste a cote : elle donne
     * l'ordre de grandeur qui manquait a un compteur isole.</p>
     */
    const total = orderStats?.total?.nbre ?? 0;
    const mesures: {
        cle: keyof OrderStats;
        icone: typeof ShoppingBag;
        libelle: string;
        part: boolean;
        ton: 'danger' | 'neutre';
    }[] = [
        { cle: 'total', icone: ShoppingBag, libelle: 'Toutes les commandes', part: false, ton: 'neutre' },
        { cle: 'pending', icone: Clock, libelle: 'En cours', part: true, ton: 'neutre' },
        { cle: 'completed', icone: CheckCircle2, libelle: 'Terminées', part: true, ton: 'neutre' },
        { cle: 'cancelled', icone: XCircle, libelle: 'Annulées', part: true, ton: 'danger' },
    ];

    return (
        <div className="flex w-full flex-col gap-4">
            {/*
             * Les filtres etaient enfermes dans une carte blanche bordee, avec deux
             * etiquettes en gras au-dessus de deux champs qui portaient DEJA leur propre
             * etiquette. Une barre d'outils n'est pas un contenu : elle n'a pas besoin
             * d'un cadre pour se distinguer de ce qu'elle filtre.
             */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                {/*
                 * La liste recevait `label="nomEtablissement"` : le nom de la propriete
                 * servait a la fois de cle de lecture et d'etiquette visible, si bien que
                 * l'operateur lisait « nomEtablissement » sous le champ, en production.
                 */}
                <div className="w-full sm:w-72">
                    <ChampListe
                        label="Partenaire"
                        onChange={choisirPartenaire}
                        options={optionsPartenaires}
                        placeholder="Rechercher un partenaire"
                        valeur={partenaire}
                    />
                </div>

                {/*
                 * Le selecteur de periode partage. Il etait remonte ici a la main, quarante
                 * lignes identiques a celles de `date-filter-input` : c'etait la SIXIEME
                 * copie du meme montage dans le depot. La bonne place de ce bloc reste un
                 * `ChampPlageDates` dans `champs-formulaire`, a cote de `ChampDate` ; c'est
                 * signale, et ce fichier ne cree pas la copie de plus en attendant.
                 */}
                <DateFilterInput filters={plage} handleDateChange={choisirPlage} />

                {/* Le retour a zero n'apparait que lorsqu'il a un effet : toujours present,
                    il devient du decor qu'on cesse de voir. */}
                {filtreActif && (
                    <Button onPress={reinitialiser} size="sm" variant="ghost">
                        <RotateCcw aria-hidden="true" className="size-4" />
                        Réinitialiser
                    </Button>
                )}

                {/*
                 * Combien de commandes le filtre a rendu : `totalElements` etait lu par la
                 * pagination mais n'etait montre nulle part. C'est aussi ce total qui porte
                 * l'orientation quand la barre de pagination se retire faute d'une deuxieme
                 * page ; il ne doit donc jamais mentir.
                 *
                 * Il se met en attente quand le FILTRE change — le moment ou il devient
                 * faux — et pas au changement de page, qui ne touche pas au total : le
                 * squelettiser a chaque « suivant » l'aurait fait clignoter pour rien, comme
                 * le faisaient les cartes avant qu'on separe les deux chargements.
                 */}
                {!erreur && commandes && (
                    <span className="text-sm text-muted sm:ml-auto">
                        {statsEnChargement ? (
                            <>
                                <span
                                    aria-hidden="true"
                                    className="inline-block h-4 w-16 animate-pulse rounded bg-surface-secondary align-middle"
                                />
                                <span className="sr-only">Décompte en cours de lecture</span>
                            </>
                        ) : (
                            <>
                                <span className="font-semibold tabular-nums text-foreground">
                                    {formatNombre(commandes.totalElements)}
                                </span>{' '}
                                commande{commandes.totalElements > 1 ? 's' : ''}
                            </>
                        )}
                    </span>
                )}
            </div>

            {/*
             * Sur un echec, pas de cartes : une carte a 0 se lit comme "aucune commande",
             * ce qui est faux ici. L'echec de la liste est porte par le tableau.
             *
             * La grille est la grille PARTAGEE, et non une quatorzieme grille recopiee a la
             * main. `md:` s'y ajoute : ses ruptures s'ouvrent en `lg:` (1024 px), un seuil
             * que la fenetre d'un poste (environ 1000 px) n'atteint jamais — les quatre
             * cartes y seraient restees sur deux rangees de deux. C'est signale.
             */}
            {!erreur && orderStats && (
                <GrilleStats className="md:grid-cols-4" colonnes={4}>
                    {mesures.map((m) => {
                        const mesure: OrderStatsItem | undefined = orderStats[m.cle];
                        // Une mesure absente de la charge utile n'est pas une mesure a zero.
                        // `?? 0` faisait dire « 0 commande · 0 FCFA » a une carte qui ne
                        // savait rien : la carte rend un tiret, et sa note ne chiffre plus
                        // un montant qu'elle n'a pas recu.
                        const inconnue = mesure?.nbre == null;
                        const montant = mesure?.amount == null ? null : formatMontant(mesure.amount);
                        const part =
                            m.part && !inconnue && total > 0
                                ? Math.round(((mesure?.nbre ?? 0) / total) * 100)
                                : null;
                        const note = [montant, part === null ? null : `${part} % des commandes`]
                            .filter(Boolean)
                            .join(' · ');

                        return (
                            <CarteStat
                                accent={m.cle === 'total'}
                                icone={m.icone}
                                isError={inconnue}
                                isLoading={statsEnChargement}
                                key={m.cle}
                                libelle={m.libelle}
                                note={note || undefined}
                                ton={m.ton}
                                valeur={formatNombre(mesure?.nbre ?? 0)}
                            />
                        );
                    })}
                </GrilleStats>
            )}

            <TableauResponsive
                cleLigne={(c) => c.id}
                colonnes={colonnes}
                enChargement={enChargement}
                enCoursDeRelance={enChargement}
                erreur={erreur}
                libelle="Commandes"
                lignes={commandes?.content ?? []}
                onReessayer={reessayer}
                quoi="les commandes"
                vide={
                    filtreActif
                        ? 'Aucune commande ne correspond à ces filtres'
                        : 'Aucune commande enregistrée'
                }
            />

            {/*
             * Pendant une lecture, la barre s'attenue et cesse de repondre : c'est ce que
             * disait le `disabled={... || loadingPage}` des deux boutons d'origine.
             * `PaginationTableau` n'ayant pas de prop d'inactivite — c'est signale —, elle
             * est portee ici, doublee du garde de `allerAPage` pour l'acces au clavier, que
             * `pointer-events-none` ne couvre pas.
             */}
            {!erreur && (
                <div
                    aria-busy={enChargement}
                    className={`flex justify-center ${
                        enChargement ? 'pointer-events-none opacity-50' : ''
                    }`}
                >
                    <PaginationTableau onPage={(p) => allerAPage(p - 1)} page={pageCourante + 1} total={totalPages} />
                </div>
            )}

            {/*
             * Pourquoi la coquille est montee ici et non prise dans `FenetreAction`.
             *
             * <p>`FenetreAction` monte exactement cette sequence, et c'est bien elle qu'il
             * faudrait employer. Deux choses l'en empechent aujourd'hui, toutes deux dans
             * SON code, pas ici : elle fige `max-w-lg` sur son panneau, la moitie de ce
             * qu'il faut aux deux colonnes de cette fiche, et son bouton de retrait passe en
             * `variant="primary"` — le rouge de marque — des qu'il n'y a pas d'action a cote.
             * Or cette fiche ne fait que LIRE : peindre son unique bouton en rouge de marque
             * ferait dire a la couleur qu'un geste attend, alors que rien n'attend.</p>
             *
             * <p>Il lui manque donc une prop de largeur et un retrait neutre en lecture
             * seule. C'est signale ; ce fichier ne touche pas au composant partage.</p>
             */}
            <Modal isOpen={fiche.isOpen} onOpenChange={fiche.onOpenChange}>
                <Modal.Backdrop>
                    <Modal.Container>
                        <Modal.Dialog className="max-w-3xl">
                            {/*
                             * La fenetre d'origine etait un `div` en position fixe : pas de
                             * piege de focus, pas de fermeture a la touche Echap, pas de
                             * role de dialogue pour un lecteur d'ecran, et un fond
                             * `bg-black/40` ecrit en dur. Le `Modal` de la v3 porte tout
                             * cela.
                             */}
                            <Modal.Header>
                                <Modal.Heading>
                                    Commande #{commandeDetail?.numero ?? ''}
                                </Modal.Heading>
                                <Modal.CloseTrigger />
                            </Modal.Header>

                            <Modal.Body>
                                {commandeDetail && (
                                    <div className="flex flex-col gap-5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm text-foreground">
                                                    {commandeDetail.dateCreation
                                                        ? new Date(commandeDetail.dateCreation).toLocaleString('fr-FR')
                                                        : '—'}
                                                </div>
                                                {/* L'UUID reste lisible, mais annonce pour ce qu'il est. */}
                                                <div
                                                    className="truncate font-mono text-[11px] text-muted"
                                                    title={commandeDetail.id}
                                                >
                                                    Réf. interne {commandeDetail.id}
                                                </div>
                                            </div>
                                            <EtatCommande etat={commandeDetail.orderState} />
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                            <div className="flex flex-col gap-3">
                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                    Articles ({commandeDetail.orderItemM?.length ?? 0})
                                                </h4>

                                                {/*
                                                 * La borne est relative a la fenetre, pas
                                                 * fixe : 22 rem, c'est 352 px, soit presque
                                                 * toute la hauteur utile d'un poste (environ
                                                 * 563 px, coquille comprise). La liste
                                                 * poussait alors le decompte — sous-total,
                                                 * frais, total — hors du champ, et c'est le
                                                 * chiffre qu'on vient verifier. `Modal.Body`
                                                 * defile de lui-meme (`scroll="inside"` par
                                                 * defaut en v3), le total reste sous la
                                                 * liste sans qu'il faille y aller.
                                                 */}
                                                <div className="flex max-h-[min(22rem,32vh)] flex-col gap-2 overflow-auto pr-1">
                                                    {commandeDetail.orderItemM?.map((it) => (
                                                        <div
                                                            className="flex items-start gap-3 rounded-lg border border-separator p-3"
                                                            key={it.id}
                                                        >
                                                            {/* La quantite etait noyee dans une ligne de texte
                                                                (« Qté: 2 ») : c'est la premiere chose qu'on verifie
                                                                sur une reclamation. */}
                                                            <span className="shrink-0 rounded-md bg-surface-secondary px-2 py-1 text-sm font-semibold tabular-nums text-foreground">
                                                                {it.quantity} ×
                                                            </span>
                                                            {/* Le service ne renvoie pas le
                                                                libelle du plat. La reference
                                                                tient donc seule la place du
                                                                nom : un mot constant
                                                                (« Article ») sous un en-tete
                                                                qui dit deja « Articles » se
                                                                repete a chaque ligne sans rien
                                                                apprendre. */}
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <span
                                                                        className="min-w-0 truncate font-mono text-xs text-foreground"
                                                                        title={it.platId}
                                                                    >
                                                                        Réf. plat {it.platId}
                                                                    </span>
                                                                    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                                                                        {formatMontant(it.price ?? 0)}
                                                                    </span>
                                                                </div>
                                                                {it.optionValues?.length ? (
                                                                    <div className="mt-1 text-xs text-muted">
                                                                        Options : {it.optionValues.join(', ')}
                                                                    </div>
                                                                ) : null}
                                                                {it.accompIds?.length ? (
                                                                    <div className="mt-1 break-all text-xs text-muted">
                                                                        Accompagnements : {it.accompIds.join(', ')}
                                                                    </div>
                                                                ) : null}
                                                                {/* Les boissons etaient dans la charge utile mais
                                                                    n'etaient affichees nulle part. */}
                                                                {it.drinkIds?.length ? (
                                                                    <div className="mt-1 break-all text-xs text-muted">
                                                                        Boissons : {it.drinkIds.join(', ')}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {!commandeDetail.orderItemM?.length && (
                                                        <p className="py-6 text-center text-sm text-muted">
                                                            Aucun article sur cette commande
                                                        </p>
                                                    )}
                                                </div>

                                                <Separator />

                                                {/*
                                                 * Un decompte se lit en colonne : les montants sont a chasse
                                                 * tabulaire et alignes a droite, sur une meme verticale, pour
                                                 * qu'on voie d'un coup ce que pesent les frais devant le total.
                                                 */}
                                                <dl className="flex flex-col gap-1.5 text-sm">
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <dt className="text-muted">Sous-total</dt>
                                                        <dd className="tabular-nums text-foreground">
                                                            {formatMontant(
                                                                (commandeDetail.totalAmount ?? 0) -
                                                                    (commandeDetail.deliveryFee ?? 0) -
                                                                    (commandeDetail.serviceFee ?? 0),
                                                            )}
                                                        </dd>
                                                    </div>
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <dt className="text-muted">Frais de livraison</dt>
                                                        <dd className="tabular-nums text-foreground">
                                                            {formatMontant(commandeDetail.deliveryFee ?? 0)}
                                                        </dd>
                                                    </div>
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <dt className="text-muted">Frais de service</dt>
                                                        <dd className="tabular-nums text-foreground">
                                                            {formatMontant(commandeDetail.serviceFee ?? 0)}
                                                        </dd>
                                                    </div>
                                                    <div className="flex items-baseline justify-between gap-3 pt-1">
                                                        <dt className="font-semibold text-foreground">Total</dt>
                                                        <dd className="text-base font-bold tabular-nums text-foreground">
                                                            {formatMontant(commandeDetail.totalAmount ?? 0)}
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                                                    Livraison et client
                                                </h4>

                                                <div className="rounded-lg border border-separator p-3">
                                                    <div className="text-sm font-medium text-foreground">
                                                        {commandeDetail.recipientName ??
                                                            commandeDetail.userM?.nom ??
                                                            'Destinataire non renseigné'}
                                                    </div>
                                                    <div className="text-xs text-muted">
                                                        {commandeDetail.recipientPhone ??
                                                            commandeDetail.userM?.telephone ??
                                                            'Téléphone non renseigné'}
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border border-separator p-3">
                                                    <div className="text-sm text-foreground">
                                                        {commandeDetail.adresseM?.libelle ?? 'Adresse non fournie'}
                                                    </div>
                                                    {(commandeDetail.adresseM?.batName ||
                                                        commandeDetail.adresseM?.etage ||
                                                        commandeDetail.adresseM?.numeroPorte) && (
                                                        <div className="mt-1 text-xs text-muted">
                                                            {[
                                                                commandeDetail.adresseM?.batName,
                                                                commandeDetail.adresseM?.etage
                                                                    ? `Étage ${commandeDetail.adresseM.etage}`
                                                                    : null,
                                                                commandeDetail.adresseM?.numeroPorte
                                                                    ? `Porte ${commandeDetail.adresseM.numeroPorte}`
                                                                    : null,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(' · ')}
                                                        </div>
                                                    )}
                                                    {/* Le complement d'adresse arrivait dans la charge utile et
                                                        n'etait affiche nulle part : c'est pourtant ce qui permet
                                                        au livreur de trouver la porte. */}
                                                    {commandeDetail.adresseM?.infoSupl && (
                                                        <div className="mt-1 text-xs text-muted">
                                                            {commandeDetail.adresseM.infoSupl}
                                                        </div>
                                                    )}
                                                </div>

                                                <dl className="flex flex-col gap-1.5 text-sm">
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <dt className="text-muted">Mode de paiement</dt>
                                                        <dd className="font-medium text-foreground">
                                                            {commandeDetail.paymentMethod ?? '—'}
                                                        </dd>
                                                    </div>
                                                    <div className="flex items-baseline justify-between gap-3">
                                                        <dt className="text-muted">Commande créée</dt>
                                                        <dd className="tabular-nums text-foreground">
                                                            {commandeDetail.dateCreation
                                                                ? new Date(
                                                                      commandeDetail.dateCreation,
                                                                  ).toLocaleString('fr-FR')
                                                                : '—'}
                                                        </dd>
                                                    </div>
                                                </dl>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Modal.Body>

                            <Modal.Footer>
                                <Button onPress={fiche.onClose} variant="ghost">
                                    Fermer
                                </Button>
                            </Modal.Footer>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </div>
    );
}
