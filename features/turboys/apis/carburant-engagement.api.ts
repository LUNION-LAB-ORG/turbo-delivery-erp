import { api } from '@/lib/api';
import type { IEtatCarburantSemaine } from '@/features/turboys/types/programme.types';

/**
 * Engager le carburant d'une semaine : un envoi MULTIPART depuis le navigateur.
 *
 * <p>Le circuit finance exige un justificatif à la création d'une charge ; ici c'est le
 * PDF des programmes publiés, généré à l'écran. Un fichier ne passe pas par une action
 * serveur : on appelle le backend directement, avec le même client et le même en-tête
 * `X-User-Id` que la création d'une dépense dans le module finance.</p>
 */
export function engagerCarburant(donnees: FormData, userId?: string): Promise<IEtatCarburantSemaine> {
  const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
  if (userId) headers['X-User-Id'] = userId;
  return api.request<IEtatCarburantSemaine>({
    endpoint: '/erp/programmes/carburant/engager',
    method: 'POST',
    data: donnees,
    config: { headers },
  });
}
