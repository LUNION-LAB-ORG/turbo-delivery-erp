import { notFound } from 'next/navigation';

import ApercuCarteTrafic from './contenu';

/** Montage de la carte du trafic, hors authentification. N'existe qu'en développement. */
export default function PageApercuCarteTrafic() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuCarteTrafic />;
}
