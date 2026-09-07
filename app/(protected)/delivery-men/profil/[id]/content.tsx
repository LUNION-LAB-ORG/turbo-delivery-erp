'use client';

import { Alert, Avatar, Button, Card, Chip, Separator } from '@heroui-v3/react';
import { Camera, ImageOff, KeyRound, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';

import { ChampDate, ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';
import { FenetreAction } from '@/components/commons/FenetreAction';
import RetourButton from '@/components/dashboard/retourButton';
import { StatusChip } from '@/features/men/components/status-chip';
import { compteLivreurAPI } from '@/features/turboys/apis/compte-livreur.api';
import { turboyAPI } from '@/features/turboys/apis/turboy.api';
import { useOuverture } from '@/hooks/use-ouverture';
import { updateLivreur } from '@/src/livreurInfo/livreur-info.action';
import { LivreurDetail } from '@/types/livreur';
import { createUrlFile, getInitials } from '@/utils/createUrlFile';

/**
 * Le profil d'un coursier, en MODIFICATION.
 *
 * <h3>Ce qu'on vient y faire</h3>
 * <p>On arrive ici depuis une liste de creneaux, par « Voir le profil », et pour deux
 * raisons seulement : corriger une information d'etat civil, ou debloquer un compte qui
 * ne se connecte plus. Ce sont deux natures differentes, et l'ecran d'origine les
 * melangeait : les deux gestes de compte etaient deux petits boutons a contour neutre
 * dans le coin superieur, indiscernables l'un de l'autre, sans une phrase pour dire quand
 * on presse l'un plutot que l'autre. Toute l'explication vivait dans les commentaires du
 * fichier, c'est-a-dire nulle part pour l'agent qui a le coursier au telephone.</p>
 *
 * <p>La refonte separe les deux. Un bandeau d'identite repond a « est-ce la bonne
 * personne » : la photo, le nom, l'etat du compte, le matricule, l'affectation. Un bloc
 * « Acces a l'application » porte les deux gestes, chacun sous la situation qui l'appelle
 * (« il a change de telephone », « il a oublie son code »), parce que c'est ainsi que la
 * question arrive au standard. Le formulaire, lui, reste un formulaire.</p>
 *
 * <h3>La fenetre reelle du poste</h3>
 * <p>L'operateur ouvre l'ERP dans une fenetre d'environ 1000 x 563 px, dont 280 px pris
 * par la barre laterale : il reste a peu pres 670 px de largeur de contenu et 480 px de
 * hauteur utile. Le seuil `lg` de Tailwind est a 1024 px, donc une colonne posee en `lg:`
 * ne s'ouvre JAMAIS sur ce poste. Les deux gestes de compte tombaient alors sous le
 * formulaire entier, trois cartes et neuf champs plus bas, alors qu'ils sont la raison
 * d'une visite sur deux. La grille bascule a `md:` (768 px), seuil que ce poste franchit ;
 * sous ce seuil le bloc de gestes passe AU-DESSUS du formulaire plutot qu'a la fin, pour
 * qu'aucune largeur ne l'enterre.</p>
 *
 * <h3>Ce qui change</h3>
 * <p>Les trois images etaient posees cote a cote et de meme poids : le recto de la piece,
 * le portrait, le verso de la piece. Une piece d'identite n'a rien a faire au meme rang
 * que le visage du coursier ; elle sert a verifier le NUMERO saisi juste a cote. Les deux
 * faces rejoignent donc la carte « Piece d'identite », sous le champ qu'elles servent a
 * controler.</p>
 *
 * <p>Le titre etait peint en rouge de marque alors qu'il informe, et le bouton
 * d'enregistrement portait ses couleurs a la main (`bg-primary text-white`) avec un survol
 * identique a son etat normal, donc aucun survol. L'accent revient au seul geste dominant
 * de l'ecran, l'enregistrement : deux aplats de marque dans deux blocs voisins se
 * disputent le regard et ne designent plus rien. Emettre une cle reste un geste, mais un
 * geste de recours, en bouton a contour ; effacer un code porte le danger, qui dit sa
 * nature et non son rang.</p>
 *
 * <p>La fenetre est haute d'environ 560 px chez les operateurs : avec dix champs, le
 * bouton d'enregistrement tombait sous la ligne de flottaison. La barre d'action reste
 * collee au bas du formulaire et dit combien de modifications attendent.</p>
 */

/*
 * L'affectation servie par le back. Le formulaire n'affichait que les deux valeurs brutes
 * « TURBO » et « FREE » comme libelles de liste : l'operateur lisait un identifiant
 * d'enumeration, pas une affectation.
 *
 * La couleur : seule l'attente en porte une, parce qu'elle appelle une decision. Assigne
 * et libre sont deux categories, et une categorie ne se colore pas : le tableau des
 * coursiers peint « Assigne » en vert, ce qui a un sens quand on balaie cent lignes, aucun
 * sur une fiche qui n'en montre qu'une.
 *
 * Les libelles sont ceux de l'autre fiche de coursier
 * (`delivery-men/men/[id]/edit-content.tsx`). « Assigne a un partenaire » disait plus que
 * la donnee : `type` ne porte que l'axe TURBO / FREE / WAITING et ne dit rien de la nature
 * de l'affectataire. Une meme valeur ne peut pas s'appeler autrement d'un ecran a l'autre.
 */
const AFFECTATIONS: Record<string, { couleur: 'default' | 'warning'; libelle: string }> = {
    FREE: { couleur: 'default', libelle: 'Bird / Libre' },
    TURBO: { couleur: 'default', libelle: 'Assigné' },
    WAITING: { couleur: 'warning', libelle: 'En attente d’assignation' },
};

const AFFECTATIONS_MODIFIABLES = [
    { label: AFFECTATIONS.TURBO.libelle, value: 'TURBO' },
    { label: AFFECTATIONS.FREE.libelle, value: 'FREE' },
] as const;

type CleFichier = 'avatar' | 'cniRecto' | 'cniVerso';

/** Les champs texte de la fiche, dans la forme exacte que le serveur attend. */
function valeursServies(livreur: LivreurDetail) {
    return {
        // Tronquee au jour : le back sert parfois un horodatage complet, et un champ de
        // date qui ne sait pas le lire s'affiche VIDE, si bien que la date de naissance
        // disparaissait de l'ecran sans que rien ne le signale.
        birthDay: (livreur.birthDay ?? '').slice(0, 10),
        email: livreur.email ?? '',
        habitation: livreur.habitation ?? '',
        immatriculation: livreur.immatriculation ?? '',
        nom: livreur.nom ?? '',
        numeroCni: livreur.numeroCni ?? '',
        prenoms: livreur.prenoms ?? '',
        telephone: livreur.telephone ?? '',
        type: livreur.type ?? '',
    };
}

type Champs = ReturnType<typeof valeursServies>;

/** Le back renvoie parfois la chaine « null » plutot qu'un vide. */
function texteServi(valeur: null | string | undefined): string {
    const texte = (valeur ?? '').trim();
    return texte.toLowerCase() === 'null' ? '' : texte;
}

/**
 * Deux jeux de valeurs servies portent-ils le meme contenu ?
 *
 * <p>La comparaison se fait champ par champ et non sur l'identite de l'objet : chaque
 * rendu du serveur en fabrique un nouveau, et se fier a son identite reviendrait a jeter
 * la saisie en cours a chaque rafraichissement.</p>
 */
function memesValeurs(a: Champs, b: Champs): boolean {
    return (Object.keys(a) as Array<keyof Champs>).every((champ) => a[champ] === b[champ]);
}

/**
 * La date servie est-elle du format que le champ de date sait lire ?
 *
 * <p>`ChampDate` enveloppe `parseDate` dans un `try/catch` et rend un champ VIDE de tout
 * ce qui n'est pas `yyyy-MM-dd`. Une date servie autrement disparaissait donc de l'ecran
 * en silence, sans meme compter comme une modification. On ne devine pas le format a la
 * place du back (`03/04/1990` est deux dates selon le pays) : on garde la valeur telle
 * quelle dans l'envoi et on la MONTRE a l'agent, qui la ressaisira.</p>
 */
function dateLisible(valeur: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
    const [annee, mois, jour] = valeur.split('-').map(Number);
    const date = new Date(Date.UTC(annee, mois - 1, jour));
    return (
        date.getUTCFullYear() === annee &&
        date.getUTCMonth() === mois - 1 &&
        date.getUTCDate() === jour
    );
}

/**
 * Une face de la piece d'identite, avec son remplacement.
 *
 * <p>Quand la face manquait, l'ecran affichait le LOGO de l'entreprise a sa place. Un
 * agent qui verifie si la piece est au dossier voyait une image et concluait qu'elle
 * l'etait. Une face absente le dit maintenant, et une face dont le fichier ne repond pas
 * le dit aussi : ce sont deux verites differentes, et aucune des deux n'est une image.</p>
 *
 * <p>L'apercu d'un fichier fraichement choisi passait par `next/image` avec une URL
 * `blob:`, que l'optimiseur d'images ne sait pas servir : l'apercu ne s'affichait pas. Une
 * balise `img` nue rend le blob, `next/image` rend l'image du serveur.</p>
 */
function FacePiece({
    apercu,
    intitule,
    onChoisir,
    onRetirer,
    urlServeur,
}: {
    apercu: null | string;
    intitule: string;
    onChoisir: (fichier: File) => void;
    onRetirer: () => void;
    urlServeur: null | string;
}) {
    const champ = React.useRef<HTMLInputElement>(null);
    const idIntitule = React.useId();
    const face = intitule.toLowerCase();

    /*
     * Une URL servie ne prouve pas qu'un fichier existe derriere. L'etat « Non fournie » ne
     * se declenchait que sur un champ VIDE : une piece dont l'URL pointait dans le vide
     * rendait une image cassee, et l'agent qui verifie si la piece est au dossier voyait
     * autre chose que la verite. L'echec de chargement est desormais un etat de l'ecran.
     */
    const [imageIllisible, setImageIllisible] = React.useState(false);
    React.useEffect(() => {
        setImageIllisible(false);
    }, [urlServeur]);

    return (
        // `aria-labelledby` : sans lui, l'intitule n'etait relie a rien et les quatre
        // commandes des deux faces se presentaient sous le meme nom.
        <figure aria-labelledby={idIntitule} className="min-w-0" role="group">
            <figcaption className="mb-1.5 text-xs text-muted" id={idIntitule}>
                {intitule}
            </figcaption>
            <div className="relative aspect-[8/5] overflow-hidden rounded-lg border border-separator bg-surface-secondary">
                {apercu ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="size-full object-contain" src={apercu} />
                ) : urlServeur && !imageIllisible ? (
                    <Image
                        alt={`Pièce d’identité, ${face}`}
                        className="object-contain"
                        fill
                        onError={() => setImageIllisible(true)}
                        sizes="(min-width: 768px) 12rem, 45vw"
                        src={urlServeur}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center gap-2 px-2 text-center text-xs text-default-400">
                        <ImageOff aria-hidden="true" className="size-4 shrink-0" />
                        {urlServeur ? 'Fichier introuvable sur le serveur' : 'Non fournie'}
                    </div>
                )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                {/*
                 * C'etait un `label` enveloppant un `input type="file"` en `hidden` : un
                 * champ masque ne prend pas le focus, donc les trois commandes d'import de
                 * cet ecran etaient inatteignables au clavier. Le bouton porte le focus et
                 * ouvre le selecteur.
                 *
                 * Le nom de la commande porte la face. « Remplacer » tout court donnait
                 * deux boutons rigoureusement homonymes sur deux documents differents,
                 * l'information « recto » / « verso » ne vivant que dans un intitule
                 * qu'aucun lien ne rattachait au bouton.
                 */}
                <Button onPress={() => champ.current?.click()} size="sm" variant="outline">
                    {`${urlServeur || apercu ? 'Remplacer' : 'Ajouter'} le ${face}`}
                </Button>
                {apercu && (
                    <Button
                        aria-label={`Retirer l’image choisie pour le ${face}`}
                        onPress={onRetirer}
                        size="sm"
                        variant="ghost"
                    >
                        Retirer
                    </Button>
                )}
            </div>
            {apercu && (
                <p className="mt-1 text-xs text-muted">Nouvelle image, pas encore enregistrée.</p>
            )}
            {/*
             * Aucun `aria-label` ici : le champ est en `display:none`, donc hors de l'arbre
             * d'accessibilite. Son etiquette ne pouvait etre lue par personne. Elle vit
             * maintenant sur le bouton, seul element que le focus atteint.
             */}
            <input
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const fichier = e.target.files?.[0];
                    if (fichier) onChoisir(fichier);
                    // Sans cette remise a zero, rechoisir LE MEME fichier apres l'avoir
                    // retire ne declenche aucun evenement.
                    e.target.value = '';
                }}
                ref={champ}
                tabIndex={-1}
                type="file"
            />
        </figure>
    );
}

export default function Content({ user }: { user: LivreurDetail }) {
    const router = useRouter();
    const champAvatar = React.useRef<HTMLInputElement>(null);
    const fenetreCode = useOuverture();

    const servies = React.useMemo(() => valeursServies(user), [user]);
    const [reference, setReference] = React.useState<Champs>(servies);
    const [champs, setChamps] = React.useState<Champs>(servies);

    /*
     * La reference se resynchronise sur ce que le serveur sert.
     *
     * Elle n'etait posee qu'une fois, au premier rendu. Apres un enregistrement reussi, le
     * `router.refresh()` rendait bien la page a neuf, mais l'ecran continuait d'afficher ce
     * que l'agent avait tape : que le serveur normalise une valeur (espaces coupes, casse,
     * telephone reformate) et le compteur annoncait « 1 modification en attente » alors que
     * tout etait enregistre, tandis que « Annuler les modifications » ramenait a une valeur
     * qui n'etait plus celle d'avant la saisie.
     *
     * L'ajustement se fait pendant le rendu, sous condition d'une difference REELLE de
     * contenu : React relance le rendu sans rien peindre entre les deux, et la saisie en
     * cours n'est jetee que lorsque le serveur sert vraiment autre chose.
     */
    if (!memesValeurs(reference, servies)) {
        setReference(servies);
        setChamps(servies);
    }

    const [fichiers, setFichiers] = React.useState<Record<CleFichier, File | null>>({
        avatar: null,
        cniRecto: null,
        cniVerso: null,
    });
    const [apercus, setApercus] = React.useState<Record<CleFichier, null | string>>({
        avatar: null,
        cniRecto: null,
        cniVerso: null,
    });

    const apercusCourants = React.useRef(apercus);
    apercusCourants.current = apercus;
    React.useEffect(
        () => () => {
            Object.values(apercusCourants.current).forEach((url) => url && URL.revokeObjectURL(url));
        },
        [],
    );

    const modifier = (champ: keyof Champs, valeur: string) =>
        setChamps((precedent) => ({ ...precedent, [champ]: valeur }));

    /*
     * Le defaut le plus couteux de l'ecran d'origine tenait a une seule ligne : le
     * gestionnaire de la PHOTO ecrivait dans `cniUrlR`. Changer le portrait remplacait donc
     * le recto de la piece d'identite dans l'envoi, et le champ `avatar` n'etait JAMAIS
     * rempli : la photo ne partait pas, et le recto de la piece etait ecrase par un
     * portrait. Les trois fichiers ont maintenant une seule fonction de depot, prise par
     * leur cle : la confusion n'est plus exprimable.
     */
    const joindre = (cle: CleFichier, fichier: File) => {
        setFichiers((precedent) => ({ ...precedent, [cle]: fichier }));
        setApercus((precedent) => {
            const ancien = precedent[cle];
            if (ancien) URL.revokeObjectURL(ancien);
            return { ...precedent, [cle]: URL.createObjectURL(fichier) };
        });
    };

    const detacher = (cle: CleFichier) => {
        setFichiers((precedent) => ({ ...precedent, [cle]: null }));
        setApercus((precedent) => {
            const ancien = precedent[cle];
            if (ancien) URL.revokeObjectURL(ancien);
            return { ...precedent, [cle]: null };
        });
    };

    // Appui du standard quand la reinitialisation depuis l'application n'aboutit pas : OTP
    // WhatsApp muet, numero qui ne recoit plus. On EFFACE le code, on n'en pose pas un
    // nouveau, car un code choisi ici serait connu de quelqu'un d'autre que son titulaire.
    // D'ou le libelle : « reinitialiser » laissait croire qu'un nouveau code etait pose.
    const [effacementEnCours, setEffacementEnCours] = React.useState(false);

    async function effacerCode() {
        if (effacementEnCours) return;
        setEffacementEnCours(true);
        try {
            const reponse = await turboyAPI.reinitialiserCodeLivreur(user.id);
            // Le serveur repond 200 avec `reinitialise: false` quand il n'a rien efface.
            // L'ecran annoncait un succes dans ce cas aussi, et l'agent raccrochait en
            // croyant le compte debloque.
            if (reponse.reinitialise === false) {
                toast.error(reponse.message || "Le code n'a pas été effacé.");
                return;
            }
            const numero = texteServi(reponse.telephone);
            toast.success(
                numero
                    ? `Code effacé. Le coursier en repose un depuis le ${numero}.`
                    : reponse.message || 'Code effacé.',
            );
            fenetreCode.onClose();
        } catch {
            toast.error("L'effacement du code n'a pas abouti.");
        } finally {
            setEffacementEnCours(false);
        }
    }

    // Cle d'activation : le recours quand le livreur change de telephone.
    //
    // Le barrage appareil (RG-08/09) refuse la connexion depuis un autre appareil que celui
    // lie, et l'application dit au livreur de demander une cle au support. Toute la
    // plomberie existait (endpoint, action, hook) mais AUCUN ecran ne l'appelait : le
    // support ne pouvait pas executer le geste que l'application lui demandait.
    //
    // Le code n'est restitue QU'UNE FOIS par le serveur. On l'affiche donc a l'ecran
    // jusqu'a ce que l'agent le ferme, plutot que dans un toast qui disparait au bout de
    // trois secondes avec le code dedans.
    const [emissionEnCours, setEmissionEnCours] = React.useState(false);
    const [cleEmise, setCleEmise] = React.useState<{ code: string; expireLe: string } | null>(null);

    async function emettreCleActivation() {
        if (emissionEnCours) return;
        setEmissionEnCours(true);
        try {
            const cle = await compteLivreurAPI.emettreCle(user.id, 'Changement de telephone');
            setCleEmise({ code: cle.code, expireLe: cle.expireLe });
        } catch {
            toast.error("L'émission de la clé n'a pas abouti.");
        } finally {
            setEmissionEnCours(false);
        }
    }

    const [enregistrement, setEnregistrement] = React.useState(false);

    const champsModifies = (Object.keys(reference) as Array<keyof Champs>).filter(
        (champ) => champs[champ] !== reference[champ],
    );
    const fichiersJoints = (['avatar', 'cniRecto', 'cniVerso'] as const).filter(
        (cle) => fichiers[cle] !== null,
    );
    const nombreModifications = champsModifies.length + fichiersJoints.length;

    const annulerModifications = () => {
        setChamps(reference);
        (['avatar', 'cniRecto', 'cniVerso'] as const).forEach(detacher);
    };

    /*
     * L'ecran d'origine appelait l'action et n'en lisait pas le retour. Or `updateLivreur`
     * rend `null` sur echec, et son propre commentaire dit que le defaut est chez
     * l'appelant. Un enregistrement refuse par le serveur ne produisait donc RIEN a
     * l'ecran : ni message, ni changement, et l'agent repartait en croyant la fiche a jour.
     * Le bouton restait par ailleurs pressable pendant l'envoi, donc envoyable deux fois.
     *
     * Les deux echecs sont distincts et devaient l'etre tous les deux : le serveur qui
     * REFUSE (retour nul), et l'action serveur qu'on n'atteint pas (reseau coupe,
     * deploiement en cours), qui rejette la promesse. Sans le `catch`, ce second cas
     * repassait par le `finally`, rendait le bouton pressable et laissait l'ecran a
     * l'identique : le silence denonce plus haut, a moitie.
     */
    async function enregistrer(evenement: React.FormEvent) {
        evenement.preventDefault();
        if (enregistrement) return;
        setEnregistrement(true);

        const charge = new FormData();
        (Object.keys(champs) as Array<keyof Champs>).forEach((champ) =>
            charge.append(champ, champs[champ]),
        );
        // La fiche part entiere, y compris les champs inchanges : l'endpoint remplace
        // l'enregistrement, un envoi partiel viderait le reste.
        if (fichiers.avatar) charge.append('avatar', fichiers.avatar);
        if (fichiers.cniRecto) charge.append('cniRecto', fichiers.cniRecto);
        if (fichiers.cniVerso) charge.append('cniVerso', fichiers.cniVerso);

        try {
            const enregistre = await updateLivreur(user.id, charge);
            if (!enregistre) {
                toast.error("L'enregistrement n'a pas abouti. Vérifiez la fiche avant de réessayer.");
                return;
            }
            (['avatar', 'cniRecto', 'cniVerso'] as const).forEach(detacher);
            toast.success('Fiche enregistrée.');
            // La page est rendue par le serveur : sans cette relecture, l'ecran continue
            // d'afficher les images d'avant et le compteur de modifications ne retombe pas.
            router.refresh();
        } catch {
            toast.error("L'enregistrement n'est pas parti. Vérifiez la connexion, puis réessayez.");
        } finally {
            setEnregistrement(false);
        }
    }

    const nomComplet = [texteServi(user.nom), texteServi(user.prenoms)].filter(Boolean).join(' ');
    const matricule = texteServi(user.matricule);
    const photoServeur = texteServi(user.avatarUrl)
        ? createUrlFile(user.avatarUrl, 'backend')
        : null;
    const rectoServeur = texteServi(user.cniUrlR) ? createUrlFile(user.cniUrlR, 'backend') : null;
    const versoServeur = texteServi(user.cniUrlV) ? createUrlFile(user.cniUrlV, 'backend') : null;
    const affectation = AFFECTATIONS[champs.type] ?? null;

    /*
     * Une affectation servie hors des deux choix proposes, « WAITING » par exemple,
     * n'existait dans aucune option de la liste : le champ s'affichait VIDE et l'ecran
     * cachait l'affectation reelle du coursier. Elle est ajoutee aux choix quand c'est la
     * valeur en cours, pour rester lisible et modifiable.
     */
    const optionsAffectation = React.useMemo(() => {
        const servie = servies.type;
        if (!servie || AFFECTATIONS_MODIFIABLES.some((o) => o.value === servie)) {
            return [...AFFECTATIONS_MODIFIABLES];
        }
        return [
            ...AFFECTATIONS_MODIFIABLES,
            { label: AFFECTATIONS[servie]?.libelle ?? servie, value: servie },
        ];
    }, [servies.type]);

    const expiration = cleEmise ? new Date(cleEmise.expireLe) : null;
    const expirationLisible =
        expiration && !Number.isNaN(expiration.getTime())
            ? expiration.toLocaleString('fr-FR')
            : (cleEmise?.expireLe ?? '');

    // Une date servie hors du format que le champ sait lire ne doit pas s'evaporer :
    // l'ecran la montre et demande sa ressaisie, au lieu d'afficher un champ vide.
    const birthDayIllisible = champs.birthDay !== '' && !dateLisible(champs.birthDay);

    return (
        <div className="space-y-5 pb-10">
            <div className="flex items-center gap-2">
                <RetourButton />
                <span className="text-sm text-muted">Profil du coursier</span>
            </div>

            {/*
             * L'identite d'abord. Le titre reprenait nom et prenoms en rouge de marque
             * au-dessus d'un formulaire qui les redonnait en premiers champs. Regroupes avec
             * la photo, l'etat du compte, le matricule et l'affectation, ils repondent en une
             * ligne a « est-ce la bonne personne », et l'etat du compte explique a lui seul
             * une bonne part des appels « je n'arrive pas a me connecter ».
             */}
            <Card>
                <Card.Content className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative shrink-0">
                        <Button
                            aria-label="Changer la photo du coursier"
                            className="size-16 overflow-hidden rounded-full p-0"
                            isIconOnly
                            onPress={() => champAvatar.current?.click()}
                            variant="outline"
                        >
                            {/*
                              * Le repli etait une silhouette generique servie depuis
                              * `/assets/images/avatar.png` : un visage inconnu a la place
                              * d'une photo manquante. Les initiales ne pretendent rien.
                              *
                              * Le repli passe par `Avatar.Image` et non par une balise nue :
                              * une URL de photo qui pointe dans le vide (le dossier sans le
                              * fichier, cas deja vu sur la fiche de consultation) rendait une
                              * image cassee, SANS repli. Le composant bascule sur les
                              * initiales quand le chargement echoue, pas seulement quand
                              * l'URL est absente. L'apercu d'un fichier fraichement choisi
                              * reste une balise `img` : c'est une URL `blob:`, qu'aucun
                              * optimiseur ne sait servir.
                              */}
                            {apercus.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img alt="" className="size-full object-cover" src={apercus.avatar} />
                            ) : (
                                <Avatar className="size-full">
                                    {photoServeur && (
                                        <Avatar.Image
                                            alt={`Photo de ${nomComplet || 'ce coursier'}`}
                                            src={photoServeur}
                                        />
                                    )}
                                    <Avatar.Fallback>{getInitials(nomComplet)}</Avatar.Fallback>
                                </Avatar>
                            )}
                        </Button>
                        <span className="pointer-events-none absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-sm">
                            <Camera aria-hidden="true" className="size-3" />
                        </span>
                        {/*
                         * Pas d'`aria-label` : le champ est en `display:none`, donc hors de
                         * l'arbre d'accessibilite, et son etiquette n'etait lue par personne.
                         * Le nom de la commande vit sur le bouton ci-dessus.
                         */}
                        <input
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const fichier = e.target.files?.[0];
                                if (fichier) joindre('avatar', fichier);
                                e.target.value = '';
                            }}
                            ref={champAvatar}
                            tabIndex={-1}
                            type="file"
                        />
                    </div>

                    <div className="min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-xl font-semibold text-foreground capitalize">
                                {nomComplet || 'Nom non renseigné'}
                            </h1>
                            <StatusChip status={user.status} />
                            {affectation && (
                                <Chip
                                    color={affectation.couleur}
                                    size="sm"
                                    variant={affectation.couleur === 'default' ? 'secondary' : 'soft'}
                                >
                                    <Chip.Label>{affectation.libelle}</Chip.Label>
                                </Chip>
                            )}
                        </div>
                        <p className="text-sm text-muted">
                            {matricule ? (
                                <span className="font-mono tabular-nums">{matricule}</span>
                            ) : (
                                <span className="text-default-400">Sans matricule</span>
                            )}
                        </p>
                        {apercus.avatar && (
                            <p className="flex items-center gap-2 text-xs text-muted">
                                Nouvelle photo, pas encore enregistrée.
                                <Button onPress={() => detacher('avatar')} size="sm" variant="ghost">
                                    Retirer
                                </Button>
                            </p>
                        )}
                    </div>
                </Card.Content>
            </Card>

            {/*
             * `md:` et non `lg:`. La fenetre du poste fait environ 1000 px de large, barre
             * laterale comprise : le seuil `lg` (1024 px) n'y est jamais franchi, la
             * troisieme colonne ne s'ouvrait donc jamais et le bloc « Acces a
             * l'application » tombait tout en bas de la page, sous neuf champs et deux
             * vignettes. C'est pourtant le geste que l'agent cherche pendant qu'il a le
             * coursier au telephone.
             */}
            <div className="grid items-start gap-5 md:grid-cols-3">
                <form className="space-y-5 md:col-span-2" onSubmit={enregistrer}>
                    <Card>
                        <Card.Header>
                            <Card.Title>État civil et contact</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <ChampTexte
                                    label="Nom"
                                    onChange={(v) => modifier('nom', v)}
                                    valeur={champs.nom}
                                />
                                <ChampTexte
                                    label="Prénoms"
                                    onChange={(v) => modifier('prenoms', v)}
                                    valeur={champs.prenoms}
                                />
                                {/*
                                 * `ChampDate` ne lit que `yyyy-MM-dd` et rend un champ VIDE
                                 * de tout le reste : la date existait dans l'envoi mais plus
                                 * a l'ecran, et le compteur annoncait zero modification. Le
                                 * format servi est montre tel quel plutot que devine : selon
                                 * le pays, « 03/04/1990 » est deux dates differentes.
                                 */}
                                <ChampDate
                                    erreur={
                                        birthDayIllisible
                                            ? `Date servie dans un format illisible : « ${champs.birthDay} ». Ressaisissez-la.`
                                            : undefined
                                    }
                                    label="Date de naissance"
                                    onChange={(v) => modifier('birthDay', v)}
                                    valeur={champs.birthDay}
                                />
                                <ChampTexte
                                    label="Téléphone"
                                    onChange={(v) => modifier('telephone', v)}
                                    type="tel"
                                    valeur={champs.telephone}
                                />
                                <ChampTexte
                                    label="Domicile"
                                    onChange={(v) => modifier('habitation', v)}
                                    valeur={champs.habitation}
                                />
                                <ChampTexte
                                    label="Adresse e-mail"
                                    onChange={(v) => modifier('email', v)}
                                    type="email"
                                    valeur={champs.email}
                                />
                            </div>
                        </Card.Content>
                    </Card>

                    {/*
                     * Le numero de la piece et ses deux faces servent la MEME verification :
                     * on compare ce que porte le document a ce que porte la fiche. Ils etaient
                     * a deux bouts de l'ecran, les images en haut, le numero en dernier champ.
                     */}
                    <Card>
                        <Card.Header>
                            <Card.Title>Pièce d’identité</Card.Title>
                            {/*
                             * C'etait un champ de saisie en lecture seule dont la valeur,
                             * « Carte d'identité (CNI) », etait ecrite en dur : rien ne la
                             * servait, rien ne pouvait la changer, et elle avait l'apparence
                             * d'une donnee du coursier. Le libelle du document reste, sous sa
                             * vraie forme, celle d'une mention.
                             */}
                            <Card.Description>Carte nationale d’identité (CNI)</Card.Description>
                        </Card.Header>
                        <Card.Content className="gap-5">
                            <ChampTexte
                                label="Numéro de la pièce"
                                onChange={(v) => modifier('numeroCni', v)}
                                valeur={champs.numeroCni}
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FacePiece
                                    apercu={apercus.cniRecto}
                                    intitule="Recto"
                                    onChoisir={(f) => joindre('cniRecto', f)}
                                    onRetirer={() => detacher('cniRecto')}
                                    urlServeur={rectoServeur}
                                />
                                <FacePiece
                                    apercu={apercus.cniVerso}
                                    intitule="Verso"
                                    onChoisir={(f) => joindre('cniVerso', f)}
                                    onRetirer={() => detacher('cniVerso')}
                                    urlServeur={versoServeur}
                                />
                            </div>
                        </Card.Content>
                    </Card>

                    <Card>
                        <Card.Header>
                            <Card.Title>Affectation et véhicule</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {/*
                                 * C'etait un `select` HTML nu, avec sa bordure et son anneau de
                                 * focus ecrits a la main dans une teinte de palette brute
                                 * (`ring-red-400`) qui ne suit pas le theme. Une liste se cherche.
                                 *
                                 * Aucun choix vide n'est offert : la liste d'origine n'en avait pas
                                 * non plus, et une affectation effacee par megarde partirait telle
                                 * quelle au serveur.
                                 */}
                                <ChampListe
                                    label="Affectation"
                                    onChange={(v) => v && modifier('type', v)}
                                    options={optionsAffectation}
                                    placeholder="Choisir une affectation"
                                    valeur={champs.type}
                                />
                                <ChampTexte
                                    label="Immatriculation"
                                    onChange={(v) => modifier('immatriculation', v)}
                                    valeur={champs.immatriculation}
                                />
                            </div>
                        </Card.Content>
                    </Card>

                    {/*
                     * Le bouton d'origine occupait toute la largeur de la page, en aplat de
                     * marque : il criait plus fort que tout le reste de l'ecran, et se
                     * trouvait pourtant sous la ligne de flottaison. Il reste l'accent, c'est
                     * le geste de l'ecran, mais a sa taille, et toujours visible.
                     */}
                    <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-large border border-separator bg-surface px-4 py-3">
                        <p className="mr-auto text-xs text-muted">
                            {nombreModifications === 0
                                ? 'Aucune modification'
                                : `${nombreModifications} modification${nombreModifications > 1 ? 's' : ''} en attente`}
                        </p>
                        <Button
                            isDisabled={enregistrement || nombreModifications === 0}
                            onPress={annulerModifications}
                            variant="ghost"
                        >
                            Annuler les modifications
                        </Button>
                        {/*
                         * Jamais desactive quand le compteur est a zero. Le compteur est une
                         * DEDUCTION de l'ecran, et une deduction peut se tromper : un ecran
                         * qui croit a tort n'avoir rien a envoyer refuserait alors le geste,
                         * sans que l'agent puisse rien y faire. La v2 laissait repousser la
                         * fiche telle quelle, l'endpoint remplace l'enregistrement entier :
                         * un renvoi a l'identique ne coute rien.
                         */}
                        <Button isPending={enregistrement} type="submit" variant="primary">
                            Enregistrer
                        </Button>
                    </div>
                </form>

                {/*
                 * Les deux gestes de compte etaient deux boutons a contour neutre dans le coin
                 * de l'en-tete, « Reinitialiser le code » et « Cle d'activation », sans un mot
                 * sur ce qu'ils font ni sur la situation qui les appelle. Ils sont ici sous la
                 * phrase que l'agent entend au telephone.
                 *
                 * `order-first` sous le seuil : en une seule colonne, ce bloc passe AVANT le
                 * formulaire. Il etait auparavant le dernier element de la page, hors de vue
                 * a toutes les largeurs ou l'ecran est reellement utilise.
                 */}
                <aside className="order-first space-y-5 md:order-last">
                    <Card>
                        <Card.Header>
                            <Card.Title>Accès à l’application</Card.Title>
                        </Card.Header>
                        <Card.Content className="gap-5">
                            {/*
                             * Sans `status` : ce panneau INFORME, il porte un code a dicter.
                             * Il etait peint en rouge de marque, seul accent de l'ecran a
                             * n'appeler aucun geste, et le rouge n'y disait plus rien.
                             */}
                            {cleEmise && (
                                <Alert>
                                    <Alert.Indicator />
                                    <Alert.Content>
                                        <Alert.Title>Clé d’activation</Alert.Title>
                                        <Alert.Description>
                                            À dicter au coursier. Elle ne sera plus affichée.
                                        </Alert.Description>
                                        {/*
                                         * `break-all` et un interlettrage plus court : dans la
                                         * colonne de droite du poste (environ 215 px), un code
                                         * de huit signes a 0,3em debordait de son panneau. Il
                                         * se dicte, donc il doit tenir en entier a l'ecran.
                                         */}
                                        <p className="my-2 font-mono text-2xl font-bold break-all tracking-[0.2em] tabular-nums">
                                            {cleEmise.code}
                                        </p>
                                        <p className="text-xs">
                                            Valable jusqu’au{' '}
                                            <span className="tabular-nums">{expirationLisible}</span>. Le
                                            coursier la saisit sur l’écran de connexion de l’application.
                                        </p>
                                        <Button
                                            className="mt-3 w-fit"
                                            onPress={() => setCleEmise(null)}
                                            size="sm"
                                            variant="ghost"
                                        >
                                            J’ai noté le code
                                        </Button>
                                    </Alert.Content>
                                </Alert>
                            )}

                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Changement de téléphone
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                    L’application refuse la connexion depuis un appareil qui n’est pas
                                    celui lié au compte. La clé lève ce barrage une fois. Le code n’est
                                    affiché qu’à cet instant, jamais après.
                                </p>
                                {/*
                                 * A contour, pas en aplat de marque. L'enregistrement est le
                                 * geste dominant de l'ecran ; deux aplats rouges dans deux
                                 * blocs voisins se disputent le regard et n'en designent plus
                                 * aucun. Ce geste-ci est un recours, pas la conclusion de la
                                 * page.
                                 */}
                                <Button
                                    // La colonne fait environ 215 px sur le poste : sans
                                    // retour a la ligne, le libelle sortait du bouton.
                                    className="mt-3 h-auto py-2 text-left whitespace-normal"
                                    isPending={emissionEnCours}
                                    onPress={emettreCleActivation}
                                    variant="outline"
                                >
                                    <Smartphone aria-hidden="true" className="size-4" />
                                    Émettre une clé d’activation
                                </Button>
                            </div>

                            <Separator />

                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Code oublié
                                </p>
                                <p className="mt-1 text-xs text-muted">
                                    Le code est effacé, et le coursier en repose un depuis
                                    l’application. L’ERP n’en choisit pas un à sa place : un code dicté
                                    au téléphone serait connu d’un autre que son titulaire.
                                </p>
                                <Button
                                    className="mt-3"
                                    onPress={fenetreCode.onOpen}
                                    variant="danger-soft"
                                >
                                    <KeyRound aria-hidden="true" className="size-4" />
                                    Effacer le code
                                </Button>
                            </div>
                        </Card.Content>
                    </Card>
                </aside>
            </div>

            {/*
             * L'effacement partait au premier clic. Il laisse le coursier hors de
             * l'application jusqu'a ce qu'il repose un code, et le canal de secours (OTP) est
             * hors service : ce geste se confirme.
             */}
            <FenetreAction
                destructif
                enAttente={effacementEnCours}
                libelleAction="Effacer le code"
                onAction={effacerCode}
                onFermer={fenetreCode.onClose}
                ouvert={fenetreCode.isOpen}
                titre="Effacer le code d’accès"
            >
                <p className="text-sm text-muted">
                    {nomComplet || 'Ce coursier'} ne pourra plus ouvrir l’application tant qu’il n’aura
                    pas posé un nouveau code depuis l’écran de connexion. Le geste est immédiat et ne se
                    défait pas.
                </p>
            </FenetreAction>
        </div>
    );
}
