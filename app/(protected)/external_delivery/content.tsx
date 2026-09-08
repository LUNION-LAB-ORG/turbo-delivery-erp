'use client';

/*
 * Dispatch des courses envoyees par les partenaires : /external_delivery.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>C'est une FILE D'ATTENTE, avec une alarme qui sonne tant qu'elle n'est pas vide. La
 * question de l'operateur n'est pas « qu'y a-t-il sur cette carte », c'est « laquelle je
 * prends maintenant, et a qui je l'envoie ». Il lui faut donc, ligne apres ligne : chez
 * quel partenaire aller chercher, depuis combien de temps ca attend, ou ca doit aller,
 * et ce que ca pese. Quatre grandeurs qui n'ont de sens que COMPAREES entre elles.</p>
 *
 * <p>Des cartes empilees deux par deux interdisent precisement cette comparaison : le
 * montant etait une pastille noire au milieu de chaque carte, l'anciennete une phrase
 * grise dans un coin, et il fallait relire les dix cartes pour savoir laquelle attendait
 * depuis le plus longtemps. Les memes valeurs en colonnes se lisent d'un seul balayage
 * vertical, et les chiffres s'alignent a droite en chasse tabulaire.</p>
 *
 * <p>L'anciennete passe donc en deuxieme colonne, juste apres l'identite du partenaire :
 * c'est elle qui donne l'ordre de traitement de la file. Voir `attente-course.tsx` pour
 * sa forme et pour le seuil au-dela duquel elle appelle un geste.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Une seule chose : assigner un livreur. Le bouton est sur la ligne, en teinte
 * primaire, et c'est le seul element colore de la ligne avec l'anciennete trop longue.
 * Le statut, lui, informe : il reste en pastille neutre, comme sur les deux autres
 * ecrans de courses, parce que « en attente » est l'etat NORMAL de tout ce qui est
 * affiche ici et que colorier une categorie entiere ne dit rien.</p>
 *
 * <h3>Sur telephone</h3>
 * <p>`TableauResponsive` rend les memes colonnes, declarees une seule fois, en cartes
 * tactiles sous 768 px. La vue en cartes demandee sur mobile est donc conservee, et elle
 * ne peut plus diverger du tableau puisque les deux lisent la meme declaration.</p>
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, Button, Chip } from '@heroui-v3/react';
import { Eye, UserRoundPlus } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
import { ColonneResponsive, TableauResponsive } from '@/components/commons/TableauResponsive';
import { PaginationTableau } from '@/components/finance/recouvrements/common/pagination-tableau';

import { PaginatedResponse } from '@/types';
import { CourseExterne, LivreurDisponible } from '@/types/models';
import { getPaginationCourseExterneEnAttente } from '@/src/actions/courses.actions';
import { useAbility } from '@/hooks/use-ability';
import { createUrlFile } from '@/utils/createUrlFile';
import { AttenteCourse } from './component/attente-course';
import { CourseStatutChip, fmtXof, montantCourse } from './component/course-statut';
import DeliveryAssign from './component/delivery-assign';
import DeliveryTools from './component/deliveryTools';

interface Props {
  initialData: PaginatedResponse<CourseExterne> | null;
  delivers: LivreurDisponible[];
}

export default function Content({ initialData, delivers }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<PaginatedResponse<CourseExterne> | null>(initialData);
  // `getPaginationCourseExterneEnAttente` avale l'erreur et rend `null` : une page
  // absente est donc TOUJOURS une lecture qui a echoue, jamais une page vide.
  // Sans ce drapeau, le dispatch lisait "Aucune course en attente" et concluait
  // qu'il n'avait personne a affecter.
  const [erreurLecture, setErreurLecture] = useState(!initialData);
  const [isLoading, setIsLoading] = useState(false);
  // Un seul modal d'assignation pour tout l'ecran, porte par la course choisie. La
  // carte en montait un PAR ligne : dix modals dans le DOM pour un geste a la fois.
  const [courseAAssigner, setCourseAAssigner] = useState<CourseExterne | null>(null);
  const ability = useAbility();
  const canUpdate = ability.can('update', 'Commande');

  // Memorisee : `data` a null rendait un tableau NEUF a chaque rendu, ce qui relance
  // toute memorisation qui en depend.
  const courses = useMemo(() => data?.content ?? [], [data]);

  // Alerte sonore tant qu'il y a des courses en attente (dispatch)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [canPlayAudio, setCanPlayAudio] = useState(false);

  useEffect(() => {
    const unlockAudio = () => {
      setCanPlayAudio(true);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!canPlayAudio || !audioRef.current) return;
    if (courses.length > 0) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {
        alert('Nouvelle course — cliquez sur OK pour activer la sonnerie.');
        audioRef.current?.play();
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [courses.length, canPlayAudio]);

  // Rafraichissement silencieux : ni squelette, ni perte des lignes affichees.
  const rafraichir = useCallback(
    async (page: number) => {
      try {
        const reponse = await getPaginationCourseExterneEnAttente(page - 1, pageSize);
        setData(reponse);
        setErreurLecture(!reponse);
      } catch {
        setErreurLecture(true);
      }
    },
    [pageSize],
  );

  const fetchData = useCallback(
    async (page: number) => {
      setCurrentPage(page);
      setIsLoading(true);
      try {
        const reponse = await getPaginationCourseExterneEnAttente(page - 1, pageSize);
        setData(reponse);
        setErreurLecture(!reponse);
      } catch {
        setErreurLecture(true);
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    const minuterie = setInterval(() => rafraichir(currentPage), 15000);
    return () => clearInterval(minuterie);
  }, [currentPage, rafraichir]);

  // Les replis de valeur absente portent sur des champs que `types/models.ts` declare
  // NON optionnels. Ce type est ecrit a la main et rien ne valide la reponse HTTP a
  // l'execution : c'est le type qui promet, pas le backend.
  /*
   * « null » N'EST PAS UNE VALEUR.
   *
   * <p>Le backend rend parfois la CHAINE « null » la ou il n'a rien : la zone d'une
   * commande, notamment. Un simple test de verite la laisse passer, et l'ecran affiche
   * alors le mot « null » a l'operateur.</p>
   *
   * <p>Pire, le nom complet d'un destinataire est ASSEMBLE a partir de deux champs :
   * quand les deux manquent, la chaine vaut « null null ». Verifie a l'ecran sur la vue
   * en cartes. On retire donc ces mots-la un a un, et ce qui reste decide.</p>
   */
  const texteReel = (valeur?: null | string) => {
    const t = (valeur ?? '')
      .split(/\s+/)
      .filter((mot) => mot && mot !== 'null' && mot !== 'undefined')
      .join(' ')
      .trim();
    return t;
  };

  const colonnes: ColonneResponsive<CourseExterne>[] = useMemo(
    () => [
      {
        cle: 'partenaire',
        identite: true,
        libelle: 'Partenaire',
        // Le code de la course vit sous le nom du partenaire plutot que dans sa propre
        // colonne : il ne se compare pas d'une ligne a l'autre, il sert a nommer la
        // course au telephone. La commune le suit, parce que c'est elle qui decide
        // quel livreur est le plus proche du point d'enlevement.
        rendu: (course) => (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar size="sm">
              <Avatar.Image
                alt=""
                src={
                  course.restaurant?.logo
                    ? createUrlFile(course.restaurant.logo, 'restaurant')
                    : undefined
                }
              />
              <Avatar.Fallback>
                {(course.restaurant?.nomEtablissement ?? '?').slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">
                {course.restaurant?.nomEtablissement ?? '—'}
              </span>
              <span className="truncate text-xs text-muted">
                <span className="font-mono">{course.code ?? '—'}</span>
                {course.restaurant?.commune ? ` · ${course.restaurant.commune}` : ''}
              </span>
            </span>
          </span>
        ),
      },
      {
        cle: 'attente',
        libelle: 'Attente',
        nombre: true,
        rendu: (course) => (
          <AttenteCourse
            depuis={course.createdAt}
            enAttente={course.statut?.toUpperCase() === 'EN_ATTENTE'}
          />
        ),
      },
      {
        cle: 'livraison',
        libelle: 'Livraison',
        // La zone et le destinataire sont ceux de la PREMIERE commande, comme sur la
        // carte : une course peut en grouper plusieurs, et le backend ne renvoie pas
        // de destination unique. Le compte de commandes, colonne suivante, dit quand
        // cette premiere ligne ne raconte pas toute la course.
        rendu: (course) => {
          const premiere = course.commandes?.[0];
          const zone = texteReel(premiere?.zone);
          const destinataire = texteReel(premiere?.destinataire?.nomComplet);

          if (!zone && !destinataire) {
            return <span className="text-muted">—</span>;
          }

          return (
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm text-foreground">{zone || '—'}</span>
              {destinataire ? (
                <span className="truncate text-xs text-muted">{destinataire}</span>
              ) : null}
            </span>
          );
        },
      },
      {
        cle: 'commandes',
        libelle: 'Commandes',
        nombre: true,
        // Le mot « commande » a cote du chiffre repeterait l'en-tete de la colonne.
        rendu: (course) => <span>{course.nombreCommande ?? course.commandes?.length ?? 0}</span>,
      },
      {
        cle: 'montant',
        libelle: 'Montant',
        nombre: true,
        // C'est ce que le livreur va porter : le prix des commandes plus les frais.
        rendu: (course) => (
          <span className="font-semibold text-foreground">
            {fmtXof(montantCourse(course.commandes))}
          </span>
        ),
      },
      {
        cle: 'statut',
        libelle: 'Statut',
        // La colonne parait constante sur cet ecran, qui ne lit que les courses en
        // attente. Elle ne l'est pas : entre deux sondages, un autre operateur peut
        // avoir assigne la course, et la ligne le dit avant de disparaitre.
        rendu: (course) => <CourseStatutChip statut={course.statut} />,
      },
      {
        cle: 'actions',
        actions: true,
        libelle: 'Actions',
        // Les gestes s'alignent a GAUCHE : `TableauResponsive` ne pose `text-right`
        // que sur les colonnes de chiffres.
        rendu: (course) => (
          <div className="flex flex-wrap items-center gap-2">
            {canUpdate && course.statut?.toUpperCase() === 'EN_ATTENTE' ? (
              <Button onPress={() => setCourseAAssigner(course)} size="sm" variant="primary">
                <UserRoundPlus aria-hidden="true" className="size-4" />
                Assigner
              </Button>
            ) : null}
            {/* `as={Link}` etait une prop de la v2, ignoree en silence par le Button v3. */}
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

  const echecTotal = erreurLecture && courses.length === 0;

  return (
    <div className="w-full h-full pb-10 flex flex-col gap-5">
      <audio ref={audioRef} src="/assets/sounds/notification.wav" preload="auto" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Nouvelles courses</h1>
          <p className="text-sm text-muted mt-0.5">
            Courses envoyées par les partenaires via l&apos;intégration, à dispatcher aux livreurs.
          </p>
        </div>
        {/* Le compteur se tait en cas d'echec : "0 en attente" est la meme
            phrase que celle affichee quand il n'y a vraiment rien a dispatcher. */}
        {!echecTotal && (
          /* Des courses en attente de dispatch, c'est un travail qui attend : l'ambre
              dit ici quelque chose. */
          <Chip color={courses.length > 0 ? 'warning' : 'default'} size="sm" variant="soft">
            <Chip.Label>{data?.totalElements ?? 0} en attente</Chip.Label>
          </Chip>
        )}
      </div>

      {/* Le sondage des 15 s peut echouer alors que des lignes sont deja a l'ecran :
          sans cette ligne, l'operateur lit une file figee en croyant la voir vivre. */}
      {erreurLecture && courses.length > 0 && (
        <EtatErreur
          compact
          enCours={isLoading}
          onReessayer={() => fetchData(currentPage)}
          quoi="les courses en attente"
        />
      )}

      {/* Un tableau sur poste, les memes colonnes en cartes sur telephone. L'etat
          d'erreur et l'etat vide sont portes par le tableau : "Aucune course en
          attente" ne doit jamais s'afficher a la place d'une lecture qui a echoue. */}
      <TableauResponsive
        cleLigne={(course) => course.id}
        colonnes={colonnes}
        enChargement={isLoading}
        enCoursDeRelance={isLoading}
        erreur={echecTotal}
        libelle="Courses en attente de dispatch"
        lignes={courses}
        onReessayer={() => fetchData(currentPage)}
        quoi="les courses en attente"
        vide="Aucune course en attente. Les nouvelles courses envoyées par les partenaires apparaissent ici en temps réel."
      />

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex justify-center mt-2 w-full">
          <PaginationTableau onPage={fetchData} page={currentPage} total={data?.totalPages ?? 1} />
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
