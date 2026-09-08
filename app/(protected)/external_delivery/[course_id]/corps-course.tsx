'use client';

import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, Button, Card, Chip } from '@heroui-v3/react';
import {
  BikeIcon,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Store,
  UserRoundPlus,
  XCircle,
} from 'lucide-react';

import { FenetreAction } from '@/components/commons/FenetreAction';
import { LienBouton } from '@/components/commons/LienBouton';
import { useAbility } from '@/hooks/use-ability';
import { useOuverture } from '@/hooks/use-ouverture';
import { cn } from '@/lib/utils';
import { cancelCourseExterne, terminerCourseExterne } from '@/src/actions/courses.actions';
import { CommandeCourseExterne, CourseExterneDetail, LivreurDisponible } from '@/types/models';
import { createUrlFile } from '@/utils/createUrlFile';
import DeliveryAssign from '../component/delivery-assign';
import { timeAgo } from '../component/course-card';
import { CommandeStatutChip, CourseStatutChip, fmtXof, montantCourse } from '../component/course-statut';

/**
 * Le detail d'une course externe, tel qu'il se lit.
 *
 * <h3>Ce que l'operateur cherche quand il ouvre une course</h3>
 * <p>Il n'ouvre pas une fiche : il repond a une question. Sur une course en attente,
 * « d'ou a ou, et combien, pour decider a qui je la donne ». Sur une course assignee,
 * « qui la porte, et quel est son numero ». Une course externe est un TRAJET : un point
 * de retrait, le partenaire, et une a trois livraisons. C'est sa forme naturelle, et
 * c'est celle qui est rendue ici.</p>
 *
 * <h3>Ce que l'ecran precedent faisait</h3>
 * <p>Il empilait un bandeau d'etapes haut de 70 px pour un mot deja porte par la
 * pastille, puis une grille `lg:grid-cols-3`. Or la fenetre reelle du poste fait 1000 px
 * de large : le seuil `lg` (1024) ne s'y ouvre JAMAIS. Le partenaire, le livreur et
 * l'argent tombaient donc sous les commandes, en une seule colonne : pour lire le
 * telephone du livreur ou le total, il fallait faire defiler la page.</p>
 *
 * <p>Le partenaire etait repete trois fois : dans le bandeau, sur CHAQUE commande
 * (« Recuperation : nom du restaurant », identique d'une ligne a l'autre puisqu'une
 * course externe n'a qu'un seul retrait) et dans la colonne laterale. Le retrait est
 * maintenant dit UNE fois, a sa place, en tete du trajet.</p>
 *
 * <h3>La couleur</h3>
 * <p>Les titres etaient en `text-primary`, soit le ROUGE DE MARQUE (`--primary: 6 100%
 * 50%`), et le bandeau d'etapes peignait ses pastilles et ses filets de ce meme rouge.
 * Le rouge de marque annonce un geste ; il ne reste ici que sur le bouton qui en appelle
 * un. Le fil d'etapes ne se distingue plus que par le contraste : ce qui est fait est en
 * `foreground`, ce qui reste est en `muted`.</p>
 *
 * <h3>L'argent</h3>
 * <p>Les montants etaient poses trois fois sans jamais se comparer : deux mentions
 * « Frais : X / Commande : Y » au bas de chaque carte de commande, et trois lignes
 * « libelle a gauche, valeur a droite » dans la colonne laterale. La forme empechait de
 * voir quelle livraison pese quoi. C'est un releve : une ligne par commande, trois
 * colonnes alignees a droite en chasse tabulaire, un filet, un total.</p>
 */

/**
 * Un montant dans le releve, SANS sa devise.
 *
 * <p>`fmtXof` colle « F CFA » a chaque valeur : douze fois dans une table de trois
 * commandes, pour une devise qui ne change pas d'une ligne a l'autre. Repetee, elle
 * poussait la colonne « Total » hors du panneau. Elle est dite une fois sous la table,
 * comme sur tout releve.</p>
 */
const nombre = (v: number) => new Intl.NumberFormat('fr-FR').format(v);

/** Lien Google Maps d'un point, ou `null` quand les coordonnees manquent. */
const lienMaps = (p?: { latitude?: number | null; longitude?: number | null } | null) =>
  p?.latitude != null && p?.longitude != null
    ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}`
    : null;

/** Deux points sont le meme lieu. Sert a ne pas repeter le retrait sur chaque livraison. */
const memeLieu = (
  a?: { latitude?: number | null; longitude?: number | null } | null,
  b?: { latitude?: number | null; longitude?: number | null } | null,
) => a?.latitude === b?.latitude && a?.longitude === b?.longitude;

/**
 * Un lien qui a l'allure d'un bouton, vers l'EXTERIEUR de l'application.
 *
 * <p>`LienBouton` rend un `<Link>` de Next : c'est le bon composant pour une route de
 * l'ERP, pas pour un `tel:` ni pour une carte a ouvrir dans un autre onglet, qui ont
 * besoin de `target` et de `rel`. Les classes sont celles que le `Button` de la
 * bibliotheque emet lui-meme, l'allure reste donc la sienne.</p>
 */
function LienExterne({
  children,
  href,
  nouvelOnglet,
}: {
  children: React.ReactNode;
  href: string;
  nouvelOnglet?: boolean;
}) {
  return (
    <a
      className="button button--sm button--outline"
      href={href}
      rel={nouvelOnglet ? 'noreferrer' : undefined}
      target={nouvelOnglet ? '_blank' : undefined}
    >
      {children}
    </a>
  );
}

// ─── Fil des etapes ────────────────────────────────────────────────────────────

const ETAPES = [
  { cle: 'creee', libelle: 'Créée' },
  { cle: 'assignee', libelle: 'Assignée' },
  { cle: 'livraison', libelle: 'En livraison' },
  { cle: 'terminee', libelle: 'Terminée' },
];

/**
 * Rang atteint dans la chaine, par statut backend.
 *
 * <p>`ANNULER` vaut 0 : la regle backend n'autorise l'annulation que tant que la course
 * est EN_ATTENTE, donc rien au-dela de la creation n'a eu lieu.</p>
 */
const RANG_ATTEINT: Record<string, number> = {
  ANNULER: 0,
  EN_ATTENTE: 0,
  EN_COURS: 2,
  EN_PREPARATION: 0,
  TERMINER: 3,
  VALIDER: 1,
};

/**
 * Le fil des etapes, avec les heures qu'on connait.
 *
 * <p>Le bandeau precedent surlignait l'etape COURANTE en rouge : sur une course
 * EN_PREPARATION il annoncait donc « Créée » en gros pendant que la pastille disait
 * « En préparation ». Deux mots pour un seul etat, sur le meme ecran. Ici le fil ne dit
 * plus « vous etes ici » mais ce qui a EU LIEU, ce qui ne peut pas contredire le statut,
 * et il porte les deux horodatages qui trainaient en sous-titre.</p>
 */
function FilEtapes({ course }: { course: CourseExterneDetail }) {
  const statut = (course.statut ?? '').toUpperCase();
  const rang = RANG_ATTEINT[statut] ?? 0;
  /*
   * L'ANNEE reste. Une version precedente ecrivait « 08/09 a 10:12 », ce qui suffit pour
   * une course du jour et devient faux pour l'archive : cette meme page sert
   * `external_delivery/all`, ou l'annee est justement ce qui distingue une course de
   * l'an dernier d'une course d'aujourd'hui.
   */
  const quand = (iso?: string | null) => (iso ? dayjs(iso).format('DD/MM/YYYY à HH:mm') : null);

  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
      {ETAPES.map((etape, i) => {
        const faite = i <= rang;
        const horodatage = i === 0 ? quand(course.dateHeureDebut) : i === 3 ? quand(course.dateHeureFin) : null;
        return (
          <li className="flex items-center gap-2" key={etape.cle}>
            {i > 0 && <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted" />}
            <span
              className={cn(
                'flex items-center gap-1.5',
                faite ? 'font-medium text-foreground' : 'text-muted',
              )}
            >
              <span
                aria-hidden="true"
                className={cn('size-1.5 shrink-0 rounded-full', faite ? 'bg-foreground' : 'bg-separator')}
              />
              {etape.libelle}
              {horodatage && (
                <span className="font-normal tabular-nums text-muted">{horodatage}</span>
              )}
            </span>
          </li>
        );
      })}
      {statut === 'ANNULER' && (
        <li className="flex items-center gap-2">
          <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-muted" />
          <span className="flex items-center gap-1.5 font-medium text-danger-soft-foreground">
            <XCircle aria-hidden="true" className="size-3.5" />
            Annulée
          </span>
        </li>
      )}
    </ol>
  );
}

// ─── Trajet ────────────────────────────────────────────────────────────────────

/** Un point du trajet sur son rail : une pastille, un filet, et le contenu du point. */
function PointTrajet({
  children,
  dernier,
  icone: Icone,
}: {
  children: React.ReactNode;
  dernier?: boolean;
  icone: typeof Store;
}) {
  return (
    <li className={cn('relative flex gap-3', dernier ? 'pb-0' : 'pb-5')}>
      {!dernier && <span aria-hidden="true" className="absolute bottom-0 left-3 top-7 w-px bg-separator" />}
      <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full border border-separator bg-surface">
        <Icone aria-hidden="true" className="size-3.5 text-muted" />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

/** Intitule d'un point : « RETRAIT », « LIVRAISON 2 SUR 3 ». */
function IntituleTrajet({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
      {children}
    </span>
  );
}

function Trajet({ course }: { course: CourseExterneDetail }) {
  const commandes = course.commandes ?? [];
  const restaurant = course.restaurant;
  const logoUrl = restaurant?.logo_Url ?? restaurant?.logo;

  /*
   * Une course externe n'a qu'un seul point de retrait : celui du partenaire. Il etait
   * repete sur chaque commande, avec le meme nom d'etablissement a chaque ligne. On le
   * prend sur la premiere commande qui le porte, et a defaut sur la fiche du partenaire.
   */
  const retrait = useMemo(() => {
    const surCommande = (course.commandes ?? []).find(
      (c) => c.lieuRecuperation?.latitude != null && c.lieuRecuperation?.longitude != null,
    )?.lieuRecuperation;
    if (surCommande) return surCommande;
    return { latitude: restaurant?.latitude ?? undefined, longitude: restaurant?.longitude ?? undefined };
  }, [course.commandes, restaurant]);

  const mapsRetrait = lienMaps(retrait);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Trajet</Card.Title>
      </Card.Header>
      <Card.Content>
        <ol className="flex flex-col">
          <PointTrajet icone={Store}>
            <div className="flex flex-col gap-2">
              <IntituleTrajet>Retrait</IntituleTrajet>
              <div className="flex items-center gap-2.5">
                <Avatar size="sm">
                  <Avatar.Image alt="" src={logoUrl ? createUrlFile(logoUrl, 'restaurant') : undefined} />
                  <Avatar.Fallback>
                    {(restaurant?.nomEtablissement ?? '?').slice(0, 2).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {restaurant?.nomEtablissement ?? 'Partenaire non renseigné'}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {restaurant?.commune ?? restaurant?.localisation ?? 'Adresse non renseignée'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Le numero du partenaire n'etait nulle part sur cet ecran : c'est
                    pourtant lui qu'on appelle quand le livreur ne trouve pas le retrait. */}
                {restaurant?.telephone && (
                  <LienExterne href={`tel:${restaurant.telephone}`}>
                    <Phone aria-hidden="true" className="size-4" />
                    {restaurant.telephone}
                  </LienExterne>
                )}
                {mapsRetrait && (
                  <LienExterne href={mapsRetrait} nouvelOnglet>
                    <Navigation aria-hidden="true" className="size-4" />
                    Itinéraire
                  </LienExterne>
                )}
                {restaurant?.id && (
                  <LienBouton href={`/restaurants/${restaurant.id}`} taille="sm" variante="ghost">
                    Fiche partenaire
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </LienBouton>
                )}
              </div>
            </div>
          </PointTrajet>

          {commandes.map((cmd, i) => {
            const mapsLivraison = lienMaps(cmd.lieuLivraison);
            /*
             * Le retrait n'est rappele sur une livraison que s'il DIFFERE de celui de la
             * course : la donnee ne disparait pas, elle cesse d'etre repetee a l'identique.
             */
            const retraitPropre =
              cmd.lieuRecuperation?.latitude != null && !memeLieu(cmd.lieuRecuperation, retrait)
                ? cmd.lieuRecuperation
                : null;
            return (
              <PointTrajet dernier={i === commandes.length - 1} icone={MapPin} key={cmd.id}>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <IntituleTrajet>
                      Livraison {i + 1} sur {commandes.length}
                    </IntituleTrajet>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">{cmd.numero}</span>
                      <CommandeStatutChip statut={cmd.statut} />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {cmd.destinataire?.nomComplet ?? 'Destinataire non renseigné'}
                    </p>
                    <p className="text-xs text-muted">
                      {cmd.zone ?? 'Zone non renseignée'}
                      {cmd.lieuLivraison?.address ? ` · ${cmd.lieuLivraison.address}` : ''}
                    </p>
                    {cmd.libelle && <p className="mt-0.5 text-xs text-muted">{cmd.libelle}</p>}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span>Paiement : {cmd.modePaiement ?? 'non renseigné'}</span>
                    {/* Le vert disait « succes » sur un fait qui n'est ni bon ni mauvais.
                        Ce qui compte est qu'il DIFFERE des autres livraisons de la course. */}
                    {cmd.livraisonPaye && (
                      <Chip color="default" size="sm" variant="soft">
                        <Chip.Label>Livraison payée</Chip.Label>
                      </Chip>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {cmd.destinataire?.contact && (
                      <LienExterne href={`tel:${cmd.destinataire.contact}`}>
                        <Phone aria-hidden="true" className="size-4" />
                        {cmd.destinataire.contact}
                      </LienExterne>
                    )}
                    {mapsLivraison && (
                      <LienExterne href={mapsLivraison} nouvelOnglet>
                        <Navigation aria-hidden="true" className="size-4" />
                        Itinéraire
                      </LienExterne>
                    )}
                    {retraitPropre && lienMaps(retraitPropre) && (
                      <LienExterne href={lienMaps(retraitPropre) as string} nouvelOnglet>
                        <Store aria-hidden="true" className="size-4" />
                        Retrait propre à cette commande
                      </LienExterne>
                    )}
                  </div>
                </div>
              </PointTrajet>
            );
          })}
        </ol>

        {commandes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            Cette course ne porte aucune commande.
          </p>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Livreur ───────────────────────────────────────────────────────────────────

function BlocLivreur({ course }: { course: CourseExterneDetail }) {
  const livreur = course.livreur;

  return (
    <Card>
      <Card.Header>
        <Card.Title className="flex items-center gap-2">
          <BikeIcon aria-hidden="true" className="size-4 text-muted" />
          Livreur
        </Card.Title>
      </Card.Header>
      <Card.Content className="gap-3">
        {livreur ? (
          <>
            <div className="flex items-center gap-2.5">
              <Avatar size="sm">
                <Avatar.Image alt="" src={livreur.avatarUrl || undefined} />
                <Avatar.Fallback>{(livreur.nom ?? '?').slice(0, 2).toUpperCase()}</Avatar.Fallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {livreur.nom} {livreur.prenoms}
                </p>
                {livreur.matricule && (
                  <p className="truncate text-xs text-muted">Matricule {livreur.matricule}</p>
                )}
              </div>
            </div>
            {/* Le numero etait un lien de 12 px au milieu d'un paragraphe. L'appeler est
                le geste le plus frequent de cet ecran : c'est une cible, pas une mention. */}
            {livreur.telephone && (
              <LienExterne href={`tel:${livreur.telephone}`}>
                <Phone aria-hidden="true" className="size-4" />
                {livreur.telephone}
              </LienExterne>
            )}
          </>
        ) : (
          /* Pas de second bouton « Assigner maintenant » ici : le geste est dans la barre
             d'actions de l'ecran, toujours visible. Ce bloc dit l'etat, il ne le repete pas. */
          <p className="text-sm text-muted">
            Aucun livreur assigné. La course reste proposée au dispatch.
          </p>
        )}
      </Card.Content>
    </Card>
  );
}

// ─── Recapitulatif ─────────────────────────────────────────────────────────────

/**
 * Le releve des montants de la course.
 *
 * <h3>Pourquoi un `<table>` et non le `Table` de HeroUI v3</h3>
 * <p>Meme raisonnement que `features/finance-dashboard/components/etat/etat-financier.tsx`
 * qui le porte en detail : un releve a lignes fixes, sans tri, sans pagination et sans
 * selection n'est pas un tableau de donnees. Le `Table` v3 rend un `<table role="grid">`,
 * une grille INTERACTIVE, et son pied est un `div` : rien ne se rangerait sous une
 * colonne, or c'est precisement ce qu'un total doit faire.</p>
 *
 * <p>Ni `<thead>` ni `<tfoot>` : le gabarit d'administration leur pose un fond gris en
 * `!important` depuis `@layer components`, que les couches CSS rendent imbattable depuis
 * une classe utilitaire. Une rangee d'en-tete posee dans un `<tbody>`, avec ses
 * `scope="col"`, donne la meme association ligne/colonne aux lecteurs d'ecran.</p>
 */
function Recapitulatif({ commandes }: { commandes: CommandeCourseExterne[] }) {
  const totalFrais = commandes.reduce((s, c) => s + (c.fraisLivraison ?? 0), 0);
  const totalPrix = commandes.reduce((s, c) => s + (c.prix ?? 0), 0);

  const enTete = 'py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted';
  const cellule = 'py-1.5 ps-3 pe-0 text-right tabular-nums text-foreground';
  const filet = 'border-t border-foreground/25';

  return (
    <Card>
      <Card.Header>
        <Card.Title>Récapitulatif</Card.Title>
      </Card.Header>
      <Card.Content>
        <table className="w-full text-sm">
          <caption className="sr-only">
            Frais de livraison et prix de chaque commande de la course, et leur total, en
            francs CFA.
          </caption>
          <tbody>
            <tr className="border-b-0">
              <th className={cn(enTete, 'px-0 text-left')} scope="col">
                Commande
              </th>
              <th className={cn(enTete, 'ps-3 text-right')} scope="col">
                Frais
              </th>
              <th className={cn(enTete, 'ps-3 text-right')} scope="col">
                Prix
              </th>
              <th className={cn(enTete, 'ps-3 text-right')} scope="col">
                Total
              </th>
            </tr>
          </tbody>
          <tbody>
            {commandes.map((cmd) => (
              <tr className="border-b-0" key={cmd.id}>
                <th
                  className="whitespace-nowrap px-0 py-1.5 text-left font-mono text-xs font-normal text-muted"
                  scope="row"
                >
                  {cmd.numero}
                </th>
                <td className={cellule}>{nombre(cmd.fraisLivraison ?? 0)}</td>
                <td className={cellule}>{nombre(cmd.prix ?? 0)}</td>
                <td className={cellule}>{nombre((cmd.fraisLivraison ?? 0) + (cmd.prix ?? 0))}</td>
              </tr>
            ))}
            <tr className="border-b-0">
              {/* Le filet est porte par les CELLULES : la regle globale du gabarit
                  `table tbody tr { border-b ... }` s'applique au `tr`. */}
              <th className={cn('px-0 py-2 text-left font-semibold text-foreground', filet)} scope="row">
                Total course
              </th>
              <td className={cn(cellule, filet, 'py-2 font-semibold')}>{nombre(totalFrais)}</td>
              <td className={cn(cellule, filet, 'py-2 font-semibold')}>{nombre(totalPrix)}</td>
              <td className={cn(cellule, filet, 'py-2 font-semibold')}>
                {nombre(montantCourse(commandes))}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">Montants en F CFA.</p>
      </Card.Content>
    </Card>
  );
}

// ─── Identite et gestes ────────────────────────────────────────────────────────

/**
 * Ce qui identifie la course sous son titre : son etat, son poids, son montant, son age.
 *
 * <p>Le montant est ici et non seulement dans le releve : dans le tiroir, qui n'a qu'une
 * colonne, le releve est le dernier bloc, donc sous la pliure. « Combien » est l'une des
 * deux questions qu'on se pose en ouvrant une course ; elle se repond sans defiler.</p>
 */
export function IdentiteCourse({ course }: { course: CourseExterneDetail }) {
  const nb = course.commandes?.length ?? 0;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
      <CourseStatutChip statut={course.statut} />
      <span>
        {nb} commande{nb > 1 ? 's' : ''}
      </span>
      <span aria-hidden="true">·</span>
      <span className="font-medium tabular-nums text-foreground">
        {fmtXof(montantCourse(course.commandes))}
      </span>
      {course.dateHeureDebut && <span aria-hidden="true">·</span>}
      {course.dateHeureDebut && <span>créée {timeAgo(course.dateHeureDebut)}</span>}
    </div>
  );
}

/**
 * Les gestes de la course, avec leurs confirmations.
 *
 * <p>Rendus a part du corps parce qu'ils ne se posent pas au meme endroit : en tete sur
 * la page, dans le pied fixe du tiroir, ou ils restent atteignables sans faire defiler.
 * Les fenetres de confirmation vivent dans un portail : leur place dans l'arbre n'a
 * aucune incidence sur leur rendu.</p>
 */
export function GestesCourse({
  className,
  course,
  delivers,
  onFait,
}: {
  className?: string;
  course: CourseExterneDetail;
  delivers: LivreurDisponible[];
  /** Appele apres un geste reussi : le porteur recharge la donnee affichee. */
  onFait?: () => void;
}) {
  const router = useRouter();
  const ability = useAbility();
  const canUpdate = ability.can('update', 'Commande');

  const assignation = useOuverture();
  const annulation = useOuverture();
  const cloture = useOuverture();
  const [enAttente, setEnAttente] = React.useState(false);

  const statut = (course.statut ?? '').toUpperCase();
  const dispatchable = statut === 'EN_ATTENTE';
  const enRoute = statut === 'VALIDER' || statut === 'EN_COURS';

  if (!canUpdate || (!dispatchable && !enRoute)) {
    return null;
  }

  async function annuler() {
    const restaurantId = course.restaurant?.id;
    if (!restaurantId) {
      toast.error('Restaurant de la course introuvable.');
      return;
    }
    setEnAttente(true);
    try {
      const resultat = await cancelCourseExterne(course.id, restaurantId);
      if (resultat.status === 'success') {
        toast.success('Course annulée.');
        annulation.onClose();
        router.refresh();
        onFait?.();
      } else {
        toast.error(resultat.message || "Impossible d'annuler la course.");
      }
    } finally {
      setEnAttente(false);
    }
  }

  async function terminer() {
    setEnAttente(true);
    try {
      const resultat = await terminerCourseExterne(course.id);
      if (resultat.status === 'success') {
        toast.success('Course terminée.');
        cloture.onClose();
        router.refresh();
        onFait?.();
      } else {
        toast.error(resultat.message || 'Impossible de terminer la course.');
      }
    } finally {
      setEnAttente(false);
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {dispatchable && (
        <>
          <Button onPress={assignation.onOpen} size="sm" variant="primary">
            <UserRoundPlus aria-hidden="true" className="size-4" />
            Assigner un livreur
          </Button>
          <Button onPress={annulation.onOpen} size="sm" variant="danger-soft">
            <XCircle aria-hidden="true" className="size-4" />
            Annuler
          </Button>
        </>
      )}
      {enRoute && (
        <Button onPress={cloture.onOpen} size="sm" variant="primary">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          Terminer la course
        </Button>
      )}

      <DeliveryAssign
        delivers={delivers}
        delivery={course}
        onAssigned={onFait}
        open={assignation.isOpen}
        setOpen={assignation.onOpenChange}
      />

      <FenetreAction
        destructif
        enAttente={enAttente}
        libelleAction="Annuler la course"
        libelleFermer="Retour"
        onAction={annuler}
        onFermer={annulation.onClose}
        ouvert={annulation.isOpen}
        titre={`Annuler la course ${course.code}`}
      >
        <p className="text-sm text-foreground">
          La course sera annulée et ne sera plus proposée aux livreurs. Le partenaire{' '}
          <b>{course.restaurant?.nomEtablissement ?? ''}</b> devra la renvoyer si besoin.
        </p>
        <p className="text-xs text-muted">
          Possible uniquement tant que la course est en attente.
        </p>
      </FenetreAction>

      <FenetreAction
        enAttente={enAttente}
        libelleAction="Terminer"
        libelleFermer="Retour"
        onAction={terminer}
        onFermer={cloture.onClose}
        ouvert={cloture.isOpen}
        titre={`Terminer la course ${course.code}`}
      >
        <p className="text-sm text-foreground">
          La course sera marquée comme terminée. À utiliser si le livreur n&apos;a pas pu la
          clôturer depuis son application.
        </p>
      </FenetreAction>
    </div>
  );
}

// ─── Corps ─────────────────────────────────────────────────────────────────────

/**
 * Le corps du detail, identique sur la page et dans le tiroir.
 *
 * <p>`disposition` ne change que le CONTENANT : deux panneaux quand la place existe, une
 * colonne dans le tiroir. Le decoupage en `md:` et non en `lg:` est delibere : la fenetre
 * du poste fait 1000 px, le seuil `lg` (1024) ne s'y ouvre jamais.</p>
 */
export function CorpsCourse({
  course,
  disposition = 'page',
}: {
  course: CourseExterneDetail;
  disposition?: 'page' | 'tiroir';
}) {
  const commandes = course.commandes ?? [];

  if (disposition === 'tiroir') {
    return (
      <div className="flex flex-col gap-4">
        <FilEtapes course={course} />
        <BlocLivreur course={course} />
        <Trajet course={course} />
        <Recapitulatif commandes={commandes} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <FilEtapes course={course} />
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(0,1fr)_20rem]">
        <Trajet course={course} />
        <div className="flex flex-col gap-4">
          <BlocLivreur course={course} />
          <Recapitulatif commandes={commandes} />
        </div>
      </div>
    </div>
  );
}
