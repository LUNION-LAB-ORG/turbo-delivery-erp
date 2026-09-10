import { notFound } from 'next/navigation';

import ApercuRapportsPerformance from './contenu';

/**
 * Le rapport de performance, sur donnees d'exemple.
 *
 * <p>La page n'existe qu'en developpement.</p>
 */
export default function PageApercuRapportsPerformance() {
    if (process.env.NODE_ENV === 'production') notFound();
    return <ApercuRapportsPerformance />;
}
