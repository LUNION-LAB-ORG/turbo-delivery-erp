'use client';

import { Card, Chip, Table } from '@heroui-v3/react';
import { CalendarX, Clock, PauseCircle } from 'lucide-react';
import React from 'react';

import CarteStat, { GrilleStats } from '@/components/commons/CarteStat';
import EmptyState from '@/components/commons/EmptyState';
import ButtonRetour from '@/components/commons/bouton-retour';
import { cn } from '@/lib/utils';
import { CreneauVM, Heure, Jour, PerformanceHebdomadaire, StatutHeure } from '@/types/performance-hebdomadaire';

/**
 * La semaine de presence d'un livreur, heure par heure.
 *
 * <h3>Ce que l'ecran demandait de lire, et ce qu'il coutait</h3>
 * <p>Cet ecran repond a une seule question : <b>ce livreur a-t-il tenu sa semaine, et ou
 * sont les trous ?</b> Rien ne le disait. Il s'ouvrait sur trois nombres nus dans un cadre
 * (« 56 », « 24 », « 3 »), sans unite, chacun suivi de la meme phrase « sur 7 jours de la
 * semaine », un denominateur ecrit en dur, faux des que le planning ne compte pas sept
 * journees.</p>
 *
 * <p>En dessous, chaque journee repetait les vingt et une etiquettes horaires (04:00 a
 * 00:00) et affichait le statut de chaque heure en toutes lettres, en majuscules de base
 * de donnees : « NON_DEMARRE », « HORS_SERVICE ». Cent quarante-sept etiquettes redondantes
 * et cent quarante-sept mots a lire pour voir une forme qui tient en une bande.</p>
 *
 * <h3>Les trois questions, et ce qu'elles changent</h3>
 * <ul>
 *   <li><b>Ce qu'on regarde en premier</b> : la semaine elle-meme, datee, et la forme des
 *       journees. L'axe des heures est ecrit UNE fois, en tete ; chaque journee devient une
 *       bande continue ou un trou se voit sans etre lu. Les trois compteurs restent, avec
 *       leur unite et un denominateur COMPTE sur les donnees.</li>
 *   <li><b>Ce qui appelle un geste</b> : rien. C'est un ecran de consultation, et le seul
 *       geste est le retour. La teinte de marque quitte donc le titre et le badge du
 *       creneau ; il ne reste de couleur que la ou elle qualifie un etat (travaille, hors
 *       service, absent) et sur un compteur qui n'est pas a zero.</li>
 *   <li><b>La forme de la donnee</b> : une semaine d'heures pointees EST une matrice
 *       journees x heures. Elle le devient : colonne des journees figee a gauche, axe
 *       horaire ecrit une seule fois en tete, et des cartes au telephone, ou vingt et une
 *       colonnes ne tiennent pas.</li>
 * </ul>
 *
 * <h3>Le seul retrait de donnee</h3>
 * <p>L'ancien ecran affichait `item.debut` DEUX fois, avant et apres la grille de la
 * journee. La seconde occurrence disparait, et le champ `fin`, present dans le type sans
 * avoir jamais ete rendu, prend sa place : la fenetre programmee se lit desormais en
 * entier, de l'ouverture a la fermeture, au lieu de repeter son heure d'ouverture.</p>
 */

/*
 * Les quatre etats en JETONS du theme et non en couleurs ecrites en dur : `bg-green-500`
 * et `bg-yellow-500` ne suivent ni le mode sombre ni un changement de theme.
 *
 * <p>Aucun n'utilise l'accent de marque : ces teintes qualifient un ETAT constate, elles
 * n'appellent aucun geste. « Non demarre » n'est pas une quatrieme couleur mais une
 * surface neutre cerclee : c'est une heure qui n'a pas encore eu lieu, pas un incident.</p>
 */
const TEINTE: Record<StatutHeure, string> = {
  ABSENT: 'bg-danger',
  HORS_SERVICE: 'bg-warning',
  NON_DEMARRE: 'bg-surface-tertiary ring-1 ring-separator',
  TRAVAILLE: 'bg-success',
};

/** Le statut en francais, ecrit a cote de sa case. La legende porte la correspondance des teintes. */
const LIBELLE: Record<StatutHeure, string> = {
  ABSENT: 'Absent',
  HORS_SERVICE: 'Hors service',
  NON_DEMARRE: 'Non démarré',
  TRAVAILLE: 'Travaillé',
};

/** Une heure de l'axe de la semaine qu'AUCUN releve ne couvre sur cette journee. */
const HORS_PLANNING = 'Hors planning';

/*
 * Deux grandeurs voisines cohabitent a l'ecran et ne mesurent pas la meme chose : le
 * compteur « Heures d'arret » vient du serveur et porte sur la semaine, la ligne d'absence
 * est calculee ici sur les bornes des creneaux ABSENT d'une seule journee. Sans cette
 * phrase, un operateur cherche a les reconcilier et n'y arrive pas.
 */
const EXPLICATION_ABSENCE =
  "Somme des créneaux marqués Absent sur cette seule journée, mesurée sur leurs heures de début et de fin. Le compteur « Heures d'arrêt » en haut de page vient du serveur, porte sur la semaine entière, et ne compte pas la même chose.";

const JOUR_LONG = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });
const JOUR_LONG_ANNEE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const JOUR_COURT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const AUJOURDHUI = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', weekday: 'long' });

/**
 * Une date ISO (« 2025-04-03 ») lue en heure LOCALE.
 *
 * <p>`new Date('2025-04-03')` est interprete en UTC : sur un poste situe derriere
 * Greenwich, la date reculait d'une journee. On construit donc la date champ par champ.</p>
 *
 * <p>Cette fonction remplace aussi la table de correspondance des mois ecrite a la main,
 * qui livrait en production « Mais » pour mai, « Jull » pour juillet et « Des » pour
 * decembre, ecrivait « Fev » et « Aout » prives de leur accent, et rendait `undefined`
 * pour toute valeur hors des douze cas. Cinq mois sur douze etaient donc faux.</p>
 */
function versDateLocale(iso: string | undefined): Date | null {
  const decoupe = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!decoupe) {
    return null;
  }
  return new Date(Number(decoupe[1]), Number(decoupe[2]) - 1, Number(decoupe[3]));
}

/** « Semaine du 3 au 10 avril 2025 ». Le mois n'est repete que s'il change. */
function libelleSemaine(creneau: CreneauVM | undefined): string | null {
  const debut = versDateLocale(creneau?.debut);
  const fin = versDateLocale(creneau?.fin);
  if (!debut || !fin) {
    return null;
  }
  const memeMois = debut.getMonth() === fin.getMonth() && debut.getFullYear() === fin.getFullYear();
  return `Semaine du ${memeMois ? debut.getDate() : JOUR_LONG.format(debut)} au ${JOUR_LONG_ANNEE.format(fin)}`;
}

/**
 * Le rang d'une heure dans la JOURNEE DE SERVICE, qui ouvre a 04:00 et deborde sur minuit.
 *
 * <p>Sans ce decalage, 00:00 se classerait avant 04:00 et la fin de nuit remonterait en
 * tete de l'axe, devant l'ouverture.</p>
 */
function rangHoraire(cle: string): number {
  const heure = Number(cle);
  return heure < 4 ? heure + 24 : heure;
}

/**
 * L'axe horaire, DEDUIT des heures reellement pointees.
 *
 * <p>Il etait fige sur une liste de vingt et une heures ecrite dans deux fichiers a la fois
 * (`columns.ts` et `types/performance-hebdomadaire.ts`). Une heure hors de cette liste,
 * 01:00, 02:00 ou 03:00, etait SILENCIEUSEMENT jetee : la donnee existait, l'ecran ne la
 * montrait pas. A l'inverse, une semaine courte affichait vingt et une colonnes vides.</p>
 */
function axeDesHeures(jours: Jour[]): string[] {
  const cles = new Set<string>();
  jours.forEach((jour) => {
    (jour.heures ?? []).forEach((heure) => {
      if (heure?.debut) {
        cles.add(heure.debut.slice(0, 2));
      }
    });
  });
  return Array.from(cles).sort((a, b) => rangHoraire(a) - rangHoraire(b));
}

/** Le statut de chaque heure de la journee, indexe par l'heure de debut (« 08 »). */
function statutsParHeure(heures: Heure[] | undefined): Record<string, StatutHeure> {
  const table: Record<string, StatutHeure> = {};
  (heures ?? []).forEach((heure) => {
    if (heure?.debut && heure.statut) {
      table[heure.debut.slice(0, 2)] = heure.statut;
    }
  });
  return table;
}

function enMinutes(horaire: string | undefined): number {
  const [heures, minutes] = (horaire ?? '').split(':');
  return Number(heures || 0) * 60 + Number(minutes || 0);
}

/**
 * Le temps d'absence de la journee, mesure sur les bornes de chaque creneau absent.
 *
 * <p>On additionne `fin - debut` plutot que de compter les cases : rien ne garantit qu'un
 * creneau dure une heure, et un compte de cases affirmerait une duree qu'on n'a pas lue.</p>
 */
function dureeAbsente(heures: Heure[] | undefined): number {
  return (heures ?? [])
    .filter((heure) => heure.statut === 'ABSENT')
    .reduce((total, heure) => {
      const ecart = enMinutes(heure.fin) - enMinutes(heure.debut);
      // Un creneau qui franchit minuit rend un ecart negatif.
      return total + (ecart < 0 ? ecart + 24 * 60 : ecart);
    }, 0);
}

function formatDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) {
    return `${reste} min`;
  }
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`;
}

/** « Lundi 7 avr. ». Le nom du jour vient du serveur, la date est reformatee. */
function libelleJournee(jour: Jour): string {
  const date = versDateLocale(jour.date);
  const nom = (jour.jour ?? '').toLowerCase();
  const titre = nom ? nom.charAt(0).toUpperCase() + nom.slice(1) : '';
  if (!date) {
    return titre || 'Journée';
  }
  return titre ? `${titre} ${JOUR_COURT.format(date)}` : JOUR_COURT.format(date);
}

/** La fenetre programmee de la journee. `fin` figurait dans le type sans jamais etre rendue. */
function fenetreJournee(jour: Jour): string | null {
  const debut = (jour.debut ?? '').slice(0, 5);
  const fin = (jour.fin ?? '').slice(0, 5);
  if (!debut && !fin) {
    return null;
  }
  return fin ? `${debut} – ${fin}` : debut;
}

/**
 * La legende, consultee une fois : elle dit ce que les bandes veulent dire.
 *
 * <p>Elle porte les cinq etats, sur poste comme au telephone. Les deux vues dressent le
 * MEME axe de semaine, donc les deux laissent des cases « hors planning » sur les journees
 * plus courtes : une legende amputee au telephone ferait chercher une correspondance
 * absente pour une case pourtant affichee.</p>
 */
function Legende() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      {(Object.keys(LIBELLE) as StatutHeure[]).map((statut) => (
        <span className="flex items-center gap-1.5" key={statut}>
          <span aria-hidden="true" className={cn('size-3 rounded-sm', TEINTE[statut])} />
          {LIBELLE[statut]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-3 rounded-sm border border-separator" />
        {HORS_PLANNING}
      </span>
    </div>
  );
}

interface Props {
  data: PerformanceHebdomadaire;
}

export default function Content({ data }: Props) {
  /*
   * La date du jour est calculee APRES le montage, jamais pendant le rendu.
   *
   * <p>Ce composant est rendu une premiere fois sur le serveur : `new Date()` appele dans
   * le corps y prend le fuseau du serveur, et le client peut rendre une autre journee. La
   * marque « Aujourd'hui » sautait alors d'une ligne a l'autre a l'hydratation.</p>
   */
  const [aujourdhui, setAujourdhui] = React.useState<Date>();
  React.useEffect(() => setAujourdhui(new Date()), []);

  const cleDuJour = aujourdhui
    ? `${aujourdhui.getFullYear()}-${String(aujourdhui.getMonth() + 1).padStart(2, '0')}-${String(aujourdhui.getDate()).padStart(2, '0')}`
    : null;

  /*
   * Les journees sont triees par date. Le serveur les rend dans l'ordre ou il les trouve,
   * la reponse de reference commence par MARDI puis LUNDI, et une semaine qui se lit dans
   * le desordre ne se lit pas.
   */
  const jours = React.useMemo(
    () => [...(data.jours ?? [])].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')),
    [data.jours],
  );
  const axe = React.useMemo(() => axeDesHeures(jours), [jours]);

  const semaine = libelleSemaine(data.creneauVM);

  /*
   * Le denominateur compte les journees RENDUES, et le dit ainsi. « sur 7 jours de la
   * semaine » etait ecrit en dur ; « jours planifies » aurait affirme davantage que ce
   * qu'on lit, puisqu'une journee omise par le serveur retrecirait le denominateur en
   * silence. « Journees relevees » ne decrit que ce qui est affiche au-dessous.
   */
  const denominateur = `sur ${jours.length} ${jours.length > 1 ? 'journées relevées' : 'journée relevée'}`;
  const intitule = semaine ? `Présence heure par heure, ${semaine.toLowerCase()}` : 'Présence heure par heure';

  /*
   * La largeur minimale de la matrice SUIT l'axe deduit, au lieu d'un `min-w-[60rem]` ecrit
   * en dur : une semaine ou trois heures seulement ont ete pointees serait sinon etiree a
   * 960 px, avec trois pastilles de 300 px de large. Douze rem pour la colonne des
   * journees, deux et quart par heure. Une classe Tailwind ne peut pas porter une valeur
   * calculee au rendu, d'ou le style en ligne.
   */
  const largeurMinimale = `${12 + axe.length * 2.25}rem`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <ButtonRetour />
        <div className="min-w-0">
          {/*
            `text-primary` retire du titre : la teinte de marque appelle un geste, et un
            titre de page n'en appelle aucun. C'est sa graisse qui le distingue.
          */}
          <h1 className="text-2xl font-bold text-foreground">Planning hebdomadaire</h1>
          {semaine && <p className="text-sm text-muted">{semaine}</p>}
        </div>
        {aujourdhui && (
          <span className="ms-auto text-sm text-muted">
            Aujourd&apos;hui, {AUJOURDHUI.format(aujourdhui)}
          </span>
        )}
      </div>

      {/*
        Les trois compteurs portent desormais leur unite et un denominateur COMPTE sur les
        donnees. « sur 7 jours de la semaine » etait ecrit en dur sous chacun d'eux, donc
        faux des que le planning ne comptait pas sept journees.

        La couleur ne se declenche qu'au-dessus de zero : une semaine sans arret ni journee
        manquee reste neutre, et la teinte garde son sens quand elle apparait.
      */}
      <GrilleStats colonnes={3}>
        <CarteStat
          icone={Clock}
          libelle="Heures travaillées"
          note={denominateur}
          valeur={`${data.heureTravailParCreneau} h`}
        />
        <CarteStat
          icone={PauseCircle}
          libelle="Heures d'arrêt"
          note={denominateur}
          ton={data.heureArret > 0 ? 'attention' : 'neutre'}
          valeur={`${data.heureArret} h`}
        />
        <CarteStat
          icone={CalendarX}
          libelle="Jours manqués"
          note={denominateur}
          ton={data.jourManque > 0 ? 'danger' : 'neutre'}
          valeur={data.jourManque}
        />
      </GrilleStats>

      {jours.length === 0 ? (
        <Card>
          <Card.Content>
            <EmptyState
              subtitle="Aucune journée n'est rattachée à ce planning hebdomadaire."
              title="Semaine vide"
            />
          </Card.Content>
        </Card>
      ) : (
        <>
          {/*
            LA MATRICE, SUR POSTE.

            L'axe horaire etait repete sous chacune des sept journees. Il est ecrit une
            seule fois, en tete. La colonne des journees, elle, reste FIGEE a gauche pendant
            le defilement horizontal : on sait toujours de quelle journee on parle, meme au
            bout de vingt et une colonnes.

            L'en-tete des heures n'est PAS fige au defilement vertical de la page, et ne
            pretend plus l'etre : son conteneur ne defile pas verticalement, et lui borner
            la hauteur ajouterait un second ascenseur dans une fenetre haute de 563 px pour
            sept lignes.

            La classe d'affichage est portee par un div enveloppant, jamais par la Card :
            `md:block` est une utilitaire et l'emporte sur le `flex flex-col` de `.card`,
            ce qui aplatit la carte et annule son `gap-3`. Meme convention que
            components/commons/TableauResponsive.tsx.
          */}
          {axe.length > 0 && (
            <div className="hidden md:block">
              <Card>
                <Card.Header className="flex-row flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-foreground">Présence heure par heure</h2>
                  <Legende />
                </Card.Header>
                <Card.Content>
                  <Table>
                    <Table.ScrollContainer>
                      <Table.Content aria-label={intitule} style={{ minWidth: largeurMinimale }}>
                        <Table.Header>
                          <Table.Column className="sticky left-0 z-20 bg-surface-secondary" id="journee" isRowHeader>
                            Journée
                          </Table.Column>
                          {axe.map((heure) => (
                            <Table.Column
                              className="bg-surface-secondary px-1 text-center text-[11px] font-medium tabular-nums"
                              id={`heure-${heure}`}
                              key={heure}
                            >
                              {heure}:00
                            </Table.Column>
                          ))}
                        </Table.Header>

                        <Table.Body>
                          {jours.map((jour, index) => {
                            const statuts = statutsParHeure(jour.heures);
                            const absence = dureeAbsente(jour.heures);
                            const fenetre = fenetreJournee(jour);
                            const libelle = libelleJournee(jour);
                            const estAujourdhui = Boolean(cleDuJour && jour.date === cleDuJour);

                            return (
                              <Table.Row id={jour.date || `jour-${index}`} key={jour.date || `jour-${index}`}>
                                <Table.Cell
                                  className={cn('sticky left-0 z-10', estAujourdhui ? 'bg-surface-secondary' : 'bg-surface')}
                                >
                                  <div className="flex flex-col gap-0.5">
                                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                      {libelle}
                                      {estAujourdhui && (
                                        <Chip color="default" size="sm" variant="secondary">
                                          <Chip.Label>Aujourd&apos;hui</Chip.Label>
                                        </Chip>
                                      )}
                                    </span>
                                    {fenetre && <span className="text-xs tabular-nums text-muted">{fenetre}</span>}
                                    {absence > 0 && (
                                      <span className="text-xs tabular-nums text-danger" title={EXPLICATION_ABSENCE}>
                                        {formatDuree(absence)} d&apos;absence sur la journée
                                      </span>
                                    )}
                                  </div>
                                </Table.Cell>

                                {axe.map((heure) => {
                                  const statut = statuts[heure];
                                  const description = `${heure}:00, ${statut ? LIBELLE[statut] : HORS_PLANNING}`;
                                  return (
                                    <Table.Cell className="px-0.5 py-1" key={heure}>
                                      <span
                                        aria-label={description}
                                        className={cn(
                                          'block h-6 w-full min-w-6 rounded-sm',
                                          statut ? TEINTE[statut] : 'border border-separator',
                                        )}
                                        role="img"
                                        title={description}
                                      />
                                    </Table.Cell>
                                  );
                                })}
                              </Table.Row>
                            );
                          })}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                </Card.Content>
              </Card>
            </div>
          )}

          {/*
            AU TELEPHONE, UNE CARTE PAR JOURNEE.

            Vingt et une colonnes ne tiennent pas sur trois cent soixante-quinze pixels :
            la matrice s'y lisait en faisant glisser une bande sans en-tete. Chaque journee
            devient une carte, et l'heure reste ecrite a cote de sa case.

            Le statut est ECRIT sous chaque case, comme l'ancienne grille l'ecrivait, et non
            laisse a un `title` : un doigt ne survole pas, et rapprocher quatre teintes d'une
            legende n'est pas lire un statut. L'axe rendu est celui de la SEMAINE, non les
            seules heures pointees de la journee : une heure sans releve au milieu d'une
            fenetre doit se voir comme un trou, sinon la bande se lit continue et l'ecran
            perd sa raison d'etre.

            La meme mise en page sert sur poste quand aucune heure n'a ete pointee : il n'y
            a alors pas d'axe a dresser, mais les journees et leurs fenetres restent lisibles.
          */}
          <div className={cn('flex flex-col gap-3', axe.length > 0 && 'md:hidden')}>
            {/*
              La marge interieure de la bande de legende est portee par la CARD : `.card`
              impose deja `p-4`, et une classe posee sur Card.Content s'y AJOUTE au lieu de
              la resserrer. Le commentaire est au-dessus de l'expression : place juste apres
              un `&&` ouvrant, il casse la compilation dans ce depot.
            */}
            {axe.length > 0 && (
              <Card className="p-3">
                <Card.Content>
                  <Legende />
                </Card.Content>
              </Card>
            )}

            {jours.map((jour, index) => {
              const statuts = statutsParHeure(jour.heures);
              const absence = dureeAbsente(jour.heures);
              const fenetre = fenetreJournee(jour);
              const estAujourdhui = Boolean(cleDuJour && jour.date === cleDuJour);

              return (
                <Card key={jour.date || `carte-${index}`}>
                  <Card.Content className="gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        {libelleJournee(jour)}
                        {estAujourdhui && (
                          <Chip color="default" size="sm" variant="secondary">
                            <Chip.Label>Aujourd&apos;hui</Chip.Label>
                          </Chip>
                        )}
                      </span>
                      {fenetre && <span className="text-xs tabular-nums text-muted">{fenetre}</span>}
                    </div>

                    {absence > 0 && (
                      <span className="text-xs tabular-nums text-danger" title={EXPLICATION_ABSENCE}>
                        {formatDuree(absence)} d&apos;absence sur la journée
                      </span>
                    )}

                    {axe.length === 0 ? (
                      <p className="text-sm text-muted">Aucune heure enregistrée sur cette journée.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-x-2 gap-y-2 sm:grid-cols-4">
                        {axe.map((heure) => {
                          const statut = statuts[heure];
                          return (
                            <span className="flex flex-col items-center gap-1 text-center" key={heure}>
                              <span className="text-[11px] tabular-nums text-muted">{heure}:00</span>
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'block h-2.5 w-full rounded-sm',
                                  statut ? TEINTE[statut] : 'border border-separator',
                                )}
                              />
                              <span className="text-[10px] leading-tight text-foreground">
                                {statut ? LIBELLE[statut] : HORS_PLANNING}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
