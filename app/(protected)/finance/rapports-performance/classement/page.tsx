import { Suspense } from 'react';

import { ClassementVue } from '@/features/classement-partenaires/components/classement-vue';

/**
 * La classification des partenaires.
 *
 * <h3>Autorisation</h3>
 * <p>Aucun sujet CASL neuf. La route est une SOUS-ROUTE de
 * `/finance/rapports-performance`, declaree au menu avec
 * `read RapportPerformancePartenaire` ; `canAccessRoute` herite du chemin declare le plus
 * long qui couvre la route, par segment. Cet ecran est donc ouvert exactement aux memes
 * profils que le rapport dont il est le prolongement, sans rien ajouter au menu ni a la
 * table hors-menu. Creer un sujet dedie aurait ferme la page A TOUT LE MONDE tant qu'aucun
 * role ne l'aurait recu, et l'aurait dissociee de la page qui y mene.</p>
 *
 * <p>La donnee qu'elle expose est celle du rapport de performance, agregee autrement :
 * elle ne franchit aucune frontiere que le rapport ne franchissait pas.</p>
 */
export default function PageClassementPartenaires() {
  // Les filtres viennent de l'URL (nuqs) : useSearchParams impose une frontiere de Suspense.
  return (
    <Suspense>
      <ClassementVue />
    </Suspense>
  );
}
