'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Drawer, Spinner } from '@heroui-v3/react';
import { ExternalLink } from 'lucide-react';

import EtatErreur from '@/components/commons/EtatErreur';
import { LienBouton } from '@/components/commons/LienBouton';
import { getCourseExterne } from '@/src/actions/courses.actions';
import { CourseExterneDetail, LivreurDisponible } from '@/types/models';
import { CorpsCourse, GestesCourse, IdentiteCourse } from './corps-course';

/**
 * Le detail d'une course dans un TIROIR, ouvert depuis une liste.
 *
 * <h3>Pourquoi un tiroir plutot qu'une page</h3>
 * <p>Une course se consulte en rafale : le dispatch en ouvre une, decide, ferme, passe a
 * la suivante. Une page fait perdre trois choses a chaque aller-retour. La position dans
 * la liste, d'abord. La veille ensuite : « Nouvelles courses » se relit toutes les 15 s
 * et fait sonner une alarme tant qu'il reste des courses a dispatcher ; en quittant la
 * liste, l'operateur quitte la veille. Le temps du retour, enfin, puisque la liste est un
 * composant serveur qui se recharge.</p>
 *
 * <p>La page reste, refondue de la meme facon : elle sert l'acces DIRECT par URL, celui
 * qu'on colle dans une conversation ou qu'on ouvre dans un second onglet. Les deux rendent
 * le MEME corps, il ne peut donc pas y avoir deux verites a l'ecran.</p>
 *
 * <h3>Autonome</h3>
 * <p>Ce composant ne demande rien a la liste sinon l'identifiant de la course. Il lit le
 * detail lui-meme, sait dire qu'il charge, sait dire qu'il a echoue, et relit apres chaque
 * geste. Brancher un tiroir sur une liste tient donc en un etat et une balise.</p>
 */

/**
 * Le tiroir SANS sa lecture reseau.
 *
 * <p>Separe pour que le banc d'apercu monte la vraie coquille sur des donnees d'exemple :
 * la largeur du panneau, la tenue du pied et le defilement interieur ne se verifient pas
 * autrement, et une session est indispensable pour lire une course reelle.</p>
 */
export function VueTiroirCourse({
  chargement,
  course,
  courseId,
  delivers,
  erreur,
  onFermer,
  onRelire,
  ouvert,
}: {
  chargement: boolean;
  course: CourseExterneDetail | null;
  /** Identifiant du lien vers la page, conserve pendant l'animation de fermeture. */
  courseId: string | null;
  delivers: LivreurDisponible[];
  erreur: boolean;
  onFermer: () => void;
  onRelire: () => void;
  ouvert: boolean;
}) {
  return (
    <Drawer isOpen={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          {/* La v3 pose `w-80 sm:w-96` sur le panneau lateral : 384 px ne tiennent ni un
              trajet ni un releve de montants. Cette largeur laisse la liste derriere. */}
          <Drawer.Dialog className="w-full max-w-[95vw] sm:w-[44rem]">
            <Drawer.Header className="pe-8">
              <Drawer.Heading className="text-base font-semibold text-foreground">
                Course <span className="font-mono">{course?.code ?? ''}</span>
              </Drawer.Heading>
              {course && <IdentiteCourse course={course} />}
              <Drawer.CloseTrigger />
            </Drawer.Header>

            <Drawer.Body>
              {erreur && (
                <EtatErreur enCours={chargement} onReessayer={onRelire} quoi="le détail de la course" />
              )}
              {!erreur && !course && (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <Spinner />
                  <p className="text-sm text-muted">Lecture de la course…</p>
                </div>
              )}
              {!erreur && course && <CorpsCourse course={course} disposition="tiroir" />}
            </Drawer.Body>

            <Drawer.Footer className="justify-between">
              {courseId ? (
                <LienBouton href={`/external_delivery/${courseId}`} taille="sm" variante="ghost">
                  Ouvrir la page
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </LienBouton>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap items-center gap-2">
                {course && <GestesCourse course={course} delivers={delivers} onFait={onRelire} />}
                <Button onPress={onFermer} size="sm" variant="ghost">
                  Fermer
                </Button>
              </div>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export function TiroirCourse({
  courseId,
  delivers,
  onFermer,
}: {
  /** La course a afficher. `null` ferme le tiroir. */
  courseId: string | null;
  delivers: LivreurDisponible[];
  onFermer: () => void;
}) {
  const [course, setCourse] = useState<CourseExterneDetail | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(false);
  /*
   * Pendant l'animation de fermeture le tiroir est encore a l'ecran : sans memoire du
   * dernier identifiant, le lien vers la page disparaitrait d'un coup au lieu de glisser.
   */
  const [dernierId, setDernierId] = useState<string | null>(courseId);
  /*
   * Deux ouvertures rapprochees : la reponse de la premiere peut arriver APRES la
   * seconde. Sans ce temoin, le tiroir afficherait la course precedente sous le titre de
   * la nouvelle.
   */
  const demandeEnCours = useRef<string | null>(null);

  const charger = useCallback(async (id: string) => {
    demandeEnCours.current = id;
    setChargement(true);
    setErreur(false);
    try {
      const detail = await getCourseExterne(id);
      if (demandeEnCours.current !== id) return;
      setCourse(detail);
      // Une lecture qui echoue n'est pas une course vide : le tiroir doit le dire et
      // proposer de relancer, jamais afficher un detail a moitie rempli.
      setErreur(!detail);
    } catch {
      if (demandeEnCours.current !== id) return;
      setErreur(true);
    } finally {
      if (demandeEnCours.current === id) setChargement(false);
    }
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setDernierId(courseId);
    setCourse(null);
    charger(courseId);
  }, [courseId, charger]);

  return (
    <VueTiroirCourse
      chargement={chargement}
      course={course}
      courseId={dernierId}
      delivers={delivers}
      erreur={erreur}
      onFermer={onFermer}
      onRelire={() => dernierId && charger(dernierId)}
      ouvert={courseId != null}
    />
  );
}

export default TiroirCourse;
