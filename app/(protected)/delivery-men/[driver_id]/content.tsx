'use client';

import { Avatar, Button, Card, Chip, Tooltip } from '@heroui-v3/react';
import { ArrowLeft, ArrowUpRight, Check, Copy, ExternalLink, ImageOff, Maximize2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import EmptyState from '@/components/commons/EmptyState';
import { LienBouton } from '@/components/commons/LienBouton';
import { StatusChip } from '@/features/men/components/status-chip';
import { cn } from '@/lib/utils';
import { DeliveryMan } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';

/**
 * La fiche d'un coursier, en LECTURE.
 *
 * <h3>Ce qu'on vient y chercher</h3>
 * <p>On ouvre cet ecran pour repondre a deux questions, dans cet ordre : est-ce la bonne
 * personne, et comment la joindre. Le reste, la piece d'identite et l'affectation, sert a
 * verifier, pas a decider. La refonte pose donc l'identite en bandeau : la photo, le nom,
 * l'etat du compte, le matricule, la categorie, et le numero de telephone recopiable en un
 * clic. C'est la seule valeur qu'on emporte de cet ecran ; jusqu'ici il fallait la
 * selectionner a la souris dans une boite de saisie.</p>
 *
 * <p>La photo est la piece maitresse de la premiere question : on la compare a la photo de
 * la CNI affichee juste en dessous. Elle est donc rendue en grand (128 px sur le poste de
 * l'operateur) et elle s'ouvre en pleine taille au clic, comme les deux faces de la piece.
 * Une version intermediaire l'avait reduite a 64 px sans lui donner cette ouverture :
 * c'etait la seule image de l'ecran qu'on ne pouvait pas examiner.</p>
 *
 * <h3>Ce qui change</h3>
 * <p>La version d'origine presentait TOUTE la fiche en champs de formulaire : six
 * `Input` et une liste deroulante, bordures, etiquettes flottantes, curseur de saisie.
 * Aucun ne portait de gestionnaire de changement ; un `value` sans `onChange` est un
 * champ en lecture seule par accident, que React signale a chaque rendu. L'ecran promettait
 * donc une modification qu'il ne savait pas faire. Une fiche qu'on lit se lit : intitule
 * au-dessus, valeur en dessous, rien qui appelle le clavier.</p>
 *
 * <p>La categorie du coursier n'est ecrite qu'UNE fois, sur la ligne d'identite, a cote du
 * matricule. Elle etait aussi rendue en « Type de coursier » dans une carte « Vehicule et
 * affectation » qui ne portait aucun vehicule : une categorie de personne n'en est pas un.
 * Le seul champ de vehicule que porte le modele (types/models.ts) est l'immatriculation ;
 * une carte pour une valeur n'est pas une carte, elle rejoint la fiche personnelle.</p>
 *
 * <p>La conformite du dossier est montree en ENTIER. `cniStatut` etait seul affiche alors
 * que le meme objet sert `ficheStatut` et `contratStatut` : deux tiers de la conformite
 * restaient hors de l'ecran pour un cout d'affichage nul. Les trois pieces sont dans une
 * carte, avec les memes libelles que l'ecran d'habilitation.</p>
 *
 * <p>Aucune couleur d'accent n'est employee comme decor : les seules pastilles colorees
 * sont des ETATS (compte, conformite des pieces). Les trois titres de section etaient en
 * `text-red-600`, le rouge de marque pose sur du texte qui informe. Ce qui hierarchise un
 * titre, c'est sa graisse.</p>
 *
 * <p>Les deux photos de la piece etaient posees dans le MEME conteneur en `fill` : elles
 * se superposaient, et le verso peignait par-dessus le recto. Le recto n'a jamais ete
 * visible en production. Elles sont maintenant cote a cote, en `object-contain` (une
 * piece d'identite recadree ne se lit pas), et chacune s'ouvre en grand.</p>
 *
 * <h3>La largeur du poste</h3>
 * <p>La fenetre de l'operateur fait environ 1000 px de large, coquille comprise. Le seuil
 * `lg` de Tailwind est a 1024 px : une colonne declaree en `lg:` ne s'ouvre JAMAIS chez
 * lui. Tout ce qui doit tenir cote a cote est donc declare en `md:`.</p>
 *
 * <h3>Ce qui manque encore</h3>
 * <p>Cette route, `/delivery-men/[driver_id]`, n'est visee par aucun lien du depot : le
 * listing pointe vers `/delivery-men/men/[id]` et le menu des creneaux vers
 * `/delivery-men/profil/[id]`. Trois fiches coursier coexistent et celle-ci ne s'atteint
 * qu'en tapant l'URL. A trancher avec le commanditaire.</p>
 */

/** Statut de conformite d'une piece (M1, RG-05). Un etat, pas une categorie : la couleur y a un sens. */
const CONFORMITE = {
    A_VERIFIER: { color: 'warning', label: 'À vérifier' },
    CONFORME: { color: 'success', label: 'Conforme' },
    REFUSE: { color: 'danger', label: 'Refusé' },
} as const;

/*
 * La liste deroulante d'origine n'offrait que deux entrees ecrites en dur, « dispatcher »
 * et « livreur », et la selection se faisait sur `defaultSelectedKeys` : toute categorie
 * servie par le back en dehors de ces deux-la ne correspondait a aucune cle, le champ
 * s'affichait VIDE, et la valeur reelle du coursier disparaissait de l'ecran sans un mot.
 * On affiche la valeur servie, traduite quand on la connait, brute sinon.
 */
const CATEGORIE_LISIBLE: Record<string, string> = {
    dispatcher: 'Dispatcheur',
    livreur: 'Livreur',
};

function libelleCategorie(categorie: null | string): null | string {
    if (!categorie) return null;
    return CATEGORIE_LISIBLE[categorie.trim().toLowerCase()] ?? categorie;
}

/*
 * La naissance arrive en ISO (AAAA-MM-JJ). On la reordonne sur la chaine plutot que par un
 * `Date` : le rendu part du serveur et se poursuit dans le navigateur, et un fuseau
 * different entre les deux affichait la veille. Un format inattendu ressort tel quel,
 * jamais remplace par « date invalide ».
 */
function formatDateNaissance(valeur: null | string): null | string {
    if (!valeur) return valeur;
    const jalons = valeur.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return jalons ? `${jalons[3]}/${jalons[2]}/${jalons[1]}` : valeur;
}

/*
 * Les initiales de repli, une par nom : `getInitials` prend les deux PREMIERS mots de la
 * chaine, ce qui donne « AJ » pour « Azo Jean-Baptiste OTE » (deux fois le prenom). Elles
 * sont ici tirees du prenom puis du nom, comme sur la fiche complete, et la chaine « null »
 * servie par le back ne devient pas une initiale N.
 */
function initiale(valeur: null | string): string {
    const texte = valeur?.trim() ?? '';
    if (!texte || texte.toLowerCase() === 'null') return '';
    return texte[0].toUpperCase();
}

/*
 * Toutes les images de la fiche s'ouvrent par le meme geste : le proxy de l'ERP les sert
 * EN INLINE, alors que le backend force parfois un telechargement.
 */
function ouvrirEnGrand(source: string) {
    window.open(`/api/fichier?u=${encodeURIComponent(source)}`, '_blank', 'noreferrer');
}

/**
 * Une valeur de la fiche.
 *
 * <p>Le back renvoie parfois la chaine « null » plutot qu'un vide : sans ce filtre, la
 * fiche affichait le mot null comme s'il s'agissait du domicile du coursier.</p>
 */
function Champ({
    chiffres,
    className,
    intitule,
    valeur,
}: {
    /** Chasse fixe et chiffres tabulaires : matricule, immatriculation, date. */
    chiffres?: boolean;
    className?: string;
    intitule: string;
    valeur?: null | string;
}) {
    const texte = valeur?.trim() ?? '';
    const rempli = texte.length > 0 && texte.toLowerCase() !== 'null';

    return (
        <div className={cn('min-w-0', className)}>
            <dt className="text-xs text-muted">{intitule}</dt>
            <dd
                className={cn(
                    'mt-0.5 text-sm break-words',
                    rempli ? 'text-foreground' : 'text-default-400',
                    chiffres && 'font-mono tabular-nums',
                )}
            >
                {rempli ? texte : 'Non renseigné'}
            </dd>
        </div>
    );
}

/**
 * Une valeur qu'on emporte : le numero de telephone, le numero de la piece.
 *
 * <p>SIGNALEMENT, composant partage a faire evoluer : `components/commons/ChampCopiable`
 * ferait le meme travail, mais il ecrit `aria-label="Copier"` EN DUR. Cet ecran en porte
 * deux, le telephone et le numero de piece ; au clavier comme au lecteur d'ecran, rien ne
 * dirait lequel copie quoi. Il rend aussi la valeur en `font-mono text-xs break-all`, la
 * taille d'une cle d'API : le numero de telephone, qui est la valeur pour laquelle on
 * ouvre cet ecran, y devenait le plus petit texte de la page, et `break-all` pouvait le
 * couper en plein milieu. Le jour ou ChampCopiable prendra un `intitule` et une taille,
 * ce composant local disparait. Il est utilise par neuf ecrans : il n'est pas touche ici.</p>
 */
function ValeurRecopiable({
    intitule,
    premierPlan,
    valeur,
}: {
    /** Ce que le bouton copie, dit au lecteur d'ecran : « Copier le numero de telephone ». */
    intitule: string;
    /** La valeur qu'on vient chercher sur l'ecran : elle se lit sans se pencher. */
    premierPlan?: boolean;
    valeur: string;
}) {
    const [copie, setCopie] = useState(false);

    const copier = async () => {
        try {
            await navigator.clipboard.writeText(valeur);
            setCopie(true);
            window.setTimeout(() => setCopie(false), 2000);
        } catch {
            // Le presse-papiers peut etre refuse (contexte non securise) : la valeur reste
            // lisible et selectionnable a la main, on ne pretend pas avoir copie.
        }
    };

    return (
        <div className="flex items-center gap-2 rounded-lg border border-separator bg-surface-secondary px-3 py-2">
            <span
                className={cn(
                    'min-w-0 flex-1 break-words tabular-nums text-foreground',
                    premierPlan ? 'text-base font-semibold' : 'font-mono text-sm',
                )}
            >
                {valeur}
            </span>
            <Tooltip>
                <Button aria-label={`Copier ${intitule}`} isIconOnly onPress={copier} size="sm" variant="ghost">
                    {copie ? (
                        <Check aria-hidden="true" className="size-4 text-success" />
                    ) : (
                        <Copy aria-hidden="true" className="size-4" />
                    )}
                </Button>
                <Tooltip.Content>{copie ? 'Copié' : `Copier ${intitule}`}</Tooltip.Content>
            </Tooltip>
        </div>
    );
}

/** Une piece du dossier et son etat de conformite (M1, RG-05). */
function LigneConformite({
    intitule,
    statut,
}: {
    intitule: string;
    statut?: 'A_VERIFIER' | 'CONFORME' | 'REFUSE' | null;
}) {
    const etat = statut ? CONFORMITE[statut] : null;

    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="text-sm text-foreground">{intitule}</dt>
            <dd className="shrink-0">
                {/*
                 * Un statut absent n'est pas « a verifier » : le back ne le sert pas
                 * toujours (champ optionnel du VM). On dit qu'on ne l'a pas, on ne
                 * suppose pas a la place de l'operateur.
                 */}
                {etat ? (
                    <Chip color={etat.color} size="sm" variant="soft">
                        <Chip.Label>{etat.label}</Chip.Label>
                    </Chip>
                ) : (
                    <span className="text-sm text-default-400">Non renseigné</span>
                )}
            </dd>
        </div>
    );
}

/**
 * Une face de la piece d'identite.
 *
 * <p>`object-cover` recadrait le document : le numero, la date d'expiration et la photo
 * sortaient du cadre selon les proportions du scan. On contient l'image dans son cadre, et
 * une face absente le dit au lieu de laisser une image cassee.</p>
 */
function FacePiece({ intitule, url }: { intitule: string; url: null | string }) {
    const source = url?.trim() ? createUrlFile(url, 'backend') : null;

    return (
        <figure className="min-w-0">
            <figcaption className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-xs text-muted">{intitule}</span>
                {source && (
                    <Button
                        aria-label={`Ouvrir le ${intitule.toLowerCase()} en grand`}
                        isIconOnly
                        onPress={() => ouvrirEnGrand(source)}
                        size="sm"
                        variant="ghost"
                    >
                        <ExternalLink aria-hidden="true" className="size-4" />
                    </Button>
                )}
            </figcaption>
            <div className="relative aspect-[8/5] overflow-hidden rounded-lg border border-separator bg-surface-secondary">
                {source ? (
                    <Image
                        alt={`Pièce d'identité, ${intitule.toLowerCase()}`}
                        className="object-contain"
                        fill
                        sizes="(min-width: 768px) 22rem, 90vw"
                        src={source}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center gap-2 text-xs text-default-400">
                        <ImageOff aria-hidden="true" className="size-4" />
                        Non fournie
                    </div>
                )}
            </div>
        </figure>
    );
}

export default function Content({ driver }: { driver: DeliveryMan | null }) {
    const router = useRouter();

    /*
     * C'etait un `div` avec un `onClick` : ni tabulable, ni actionnable au clavier, et sans
     * role. Le retour est un bouton. A droite, la sortie de l'ecran : cette fiche ne fait
     * que LIRE, tout le cycle de vie du coursier (valider, activer, desactiver, assigner)
     * vit sur la fiche complete. Sans ce lien, il fallait revenir au listing pour agir.
     */
    const barre = (sortie?: ReactNode) => (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Button
                    aria-label="Revenir à l'écran précédent"
                    isIconOnly
                    onPress={() => router.back()}
                    variant="ghost"
                >
                    <ArrowLeft aria-hidden="true" className="size-5" />
                </Button>
                <span className="text-sm text-muted">Fiche coursier</span>
            </div>
            {sortie}
        </div>
    );

    /*
     * `getDeliveryDetail` peut rendre `null` (corps vide, identifiant inconnu). L'ecran
     * dressait alors le meme gabarit avec un titre vide et six boites vides : cela se lit
     * comme un coursier sans donnees, pas comme une fiche introuvable.
     */
    if (!driver) {
        return (
            <div className="space-y-5 pb-10">
                {barre()}
                <Card>
                    <Card.Content>
                        <EmptyState
                            subtitle="Cette fiche n'existe pas, ou elle n'est plus accessible."
                            title="Coursier introuvable"
                        >
                            <Button onPress={() => router.back()} variant="ghost">
                                Revenir
                            </Button>
                        </EmptyState>
                    </Card.Content>
                </Card>
            </div>
        );
    }

    /*
     * Prenoms puis nom : c'est l'ordre de la fiche complete du meme coursier
     * (delivery-men/men/[id]). Deux ecrans du meme homme ne peuvent pas l'appeler
     * autrement l'un que l'autre.
     */
    const nomComplet = [driver.prenoms, driver.nom].filter(Boolean).join(' ').trim();
    const photo = driver.avatarUrl?.trim() ? createUrlFile(driver.avatarUrl, 'backend') : null;
    const categorie = libelleCategorie(driver.category);
    const telephone = driver.telephone?.trim() ?? '';
    const matricule = driver.matricule?.trim() ?? '';
    const numeroCni = driver.numeroCni?.trim() ?? '';

    /*
     * `next/image` recevait `createUrlFile(avatarUrl ?? '')`, soit une URL qui se terminait
     * sur le dossier quand la photo manquait : une image cassee, sans repli. Le repli sur
     * les initiales est rendu par le composant, pas par le navigateur.
     */
    const portrait = (
        <Avatar className="size-24 shrink-0 md:size-32">
            {photo && <Avatar.Image alt={`Photo de ${nomComplet || 'ce coursier'}`} src={photo} />}
            <Avatar.Fallback>{`${initiale(driver.prenoms)}${initiale(driver.nom)}` || '?'}</Avatar.Fallback>
        </Avatar>
    );

    return (
        <div className="space-y-5 pb-10">
            {barre(
                <LienBouton href={`/delivery-men/men/${driver.id}`} taille="sm">
                    Ouvrir la fiche complète
                    <ArrowUpRight aria-hidden="true" className="size-4" />
                </LienBouton>,
            )}

            {/*
             * L'identite d'abord : la photo repondait deja a « est-ce la bonne personne »,
             * mais elle etait posee seule, centree, au-dessus d'un formulaire qui redonnait
             * le nom en premier champ. Regroupee avec le nom, l'etat du compte, le
             * matricule, la categorie et le numero, elle repond a la question en une ligne.
             */}
            <Card>
                <Card.Content className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        {photo ? (
                            <button
                                aria-label="Ouvrir la photo du coursier en grand"
                                className="group relative shrink-0 cursor-zoom-in rounded-3xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-accent"
                                onClick={() => ouvrirEnGrand(photo)}
                                type="button"
                            >
                                {portrait}
                                {/*
                                 * Une pastille posee sur la photo, VISIBLE en permanence, et
                                 * non un voile au survol : une pastille se voit sans promener
                                 * la souris, et le voile de la galerie voisine est peint en
                                 * `bg-black/45`, une couleur que ce theme ne definit pas (le
                                 * voile y est donc transparent, verifie a l'ecran). Ici, deux
                                 * jetons du theme et rien d'ecrit en dur.
                                 */}
                                <span className="absolute right-0.5 bottom-0.5 flex size-7 items-center justify-center rounded-full border border-separator bg-surface text-muted transition-colors group-hover:text-foreground">
                                    <Maximize2 aria-hidden="true" className="size-3.5" />
                                </span>
                            </button>
                        ) : (
                            portrait
                        )}
                        <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl font-semibold break-words text-foreground capitalize">
                                    {nomComplet || 'Nom non renseigné'}
                                </h1>
                                <StatusChip status={driver.status} />
                            </div>
                            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                                {matricule ? (
                                    <span className="font-mono tabular-nums">{matricule}</span>
                                ) : (
                                    <span className="text-default-400">Sans matricule</span>
                                )}
                                {categorie && (
                                    <>
                                        <span aria-hidden="true">·</span>
                                        <span>{categorie}</span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {/*
                     * Le numero est la seule valeur qu'on emporte de cet ecran : il se lit
                     * en grand et se recopie en un clic, au lieu de se selectionner a la
                     * souris dans une boite de saisie.
                     */}
                    <div className="shrink-0 md:w-60">
                        <p className="mb-1 text-xs text-muted">Téléphone</p>
                        {telephone ? (
                            <ValeurRecopiable intitule="le numéro de téléphone" premierPlan valeur={telephone} />
                        ) : (
                            <p className="text-sm text-default-400">Non renseigné</p>
                        )}
                    </div>
                </Card.Content>
            </Card>

            {/*
             * Deux tiers, un tiers, et en `md:` : sur un poste a 1000 px, une colonne
             * declaree en `lg:` ne s'ouvre JAMAIS, et la fiche se lisait alors en une seule
             * colonne haute de deux ecrans.
             */}
            <div className="grid items-start gap-5 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <Card.Header>
                        <Card.Title>Informations personnelles</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        {/*
                         * Nom et prenoms restent lisibles separement malgre le bandeau : sur
                         * un controle de piece, on compare champ par champ ce que porte le
                         * document a ce que porte la fiche. L'immatriculation les rejoint :
                         * c'est le seul champ de vehicule que porte le modele, et une carte
                         * pour une valeur n'est pas une carte.
                         */}
                        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                            <Champ intitule="Nom" valeur={driver.nom} />
                            <Champ intitule="Prénoms" valeur={driver.prenoms} />
                            <Champ
                                chiffres
                                intitule="Date de naissance"
                                valeur={formatDateNaissance(driver.birthDay)}
                            />
                            <Champ intitule="Domicile" valeur={driver.habitation} />
                            {/* L'adresse tient sur une ligne plutot que de se couper en deux. */}
                            <Champ className="sm:col-span-2" intitule="Adresse e-mail" valeur={driver.email} />
                            <Champ chiffres intitule="Immatriculation" valeur={driver.immatriculation} />
                        </dl>
                    </Card.Content>
                </Card>

                {/*
                 * L'etat de la CNI etait une pastille posee sur le titre de la carte de la
                 * piece ; il est ici, avec les deux autres pieces du dossier, pour ne pas
                 * ecrire la meme chose a deux endroits. Memes libelles que l'ecran
                 * d'habilitation, qui est celui ou on les change.
                 */}
                <Card>
                    <Card.Header>
                        <Card.Title>Conformité des pièces</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <dl className="space-y-3">
                            <LigneConformite intitule="CNI" statut={driver.cniStatut} />
                            <LigneConformite intitule="Fiche d'identification" statut={driver.ficheStatut} />
                            <LigneConformite intitule="Contrat" statut={driver.contratStatut} />
                        </dl>
                    </Card.Content>
                </Card>
            </div>

            {/*
             * La piece occupe toute la largeur : c'est l'image qu'on COMPARE au visage du
             * bandeau, et deux vignettes serrees dans un tiers d'ecran ne se comparent pas.
             */}
            <Card>
                <Card.Header>
                    <Card.Title>Pièce d&apos;identité</Card.Title>
                </Card.Header>
                <Card.Content className="space-y-4">
                    <div className="sm:max-w-xs">
                        <p className="mb-1 text-xs text-muted">Numéro de la pièce</p>
                        {numeroCni ? (
                            <ValeurRecopiable intitule="le numéro de la pièce" valeur={numeroCni} />
                        ) : (
                            <p className="text-sm text-default-400">Non renseigné</p>
                        )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FacePiece intitule="Recto" url={driver.cniUrlR} />
                        <FacePiece intitule="Verso" url={driver.cniUrlV} />
                    </div>
                </Card.Content>
            </Card>
        </div>
    );
}
