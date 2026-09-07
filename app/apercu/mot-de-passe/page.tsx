import { notFound } from 'next/navigation';

import { FormChangePassword } from '@/components/auth/form-change-password';

/**
 * Rendu de la fenêtre de changement de mot de passe obligatoire.
 *
 * <p>Elle ne s'affiche qu'après une connexion dont le compte n'a jamais changé son mot
 * de passe : impossible de la regarder autrement qu'en la montant seule.</p>
 */
export default function PageApercuMotDePasse() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <FormChangePassword userName="apercu" />;
}
