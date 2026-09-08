import { notFound } from 'next/navigation';

import ApercuListeCourses from './contenu';

/** Banc de la LISTE des courses externes. N'existe qu'en développement. */
export default function PageApercuListeCourses() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuListeCourses />;
}
