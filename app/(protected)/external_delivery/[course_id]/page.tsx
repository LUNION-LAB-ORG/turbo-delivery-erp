import { Metadata } from 'next';
import NotFound from '@/app/not-found';
import Content from './content';
import { getCourseExterne } from '@/src/actions/courses.actions';
import { getLivreursDisponible } from '@/src/actions/delivery-men.actions';

export const metadata: Metadata = {
  title: 'Détail de la course',
};

export default async function CourseExterneDetailPage(props: { params: Promise<{ course_id: string }> }) {
  const params = await props.params;

  /*
   * Les deux lectures ne dependent pas l'une de l'autre : enchainees, elles ajoutaient
   * un aller-retour reseau complet a l'ouverture d'une course. `getLivreursDisponible`
   * relance desormais au lieu de rendre null, l'echec part donc vers la frontiere
   * d'erreur du segment dans les deux cas.
   */
  const [course, delivers] = await Promise.all([
    getCourseExterne(params.course_id),
    getLivreursDisponible(),
  ]);

  if (!course) {
    return <NotFound />;
  }
  return <Content course={course} delivers={delivers} />;
}
