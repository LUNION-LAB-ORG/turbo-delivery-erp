import { useMutation } from '@tanstack/react-query';
import { useInvalidateTicketsQuery } from './index.query';
import { authentifierTicket, createBonLivraison, deleteBonLivraison, updateBonLivraison } from '@/src/actions/bon-commande.action';
import { restaurerArchivesRequest } from '@/features/tickets/request/tickets.request';
import { Ticket } from '@/types/bon-livraison.model';
import { toast } from 'sonner';

import { estVersionPerimee, signalerVersionPerimee } from '@/features/tickets/utils/version-perimee';

/*
 * Un echec d'action serveur n'est pas un echec de ticket.
 *
 * <p>Quand la page est en retard sur le serveur, Next repond 404 et « Server Action …
 * was not found ». L'ecran affichait ce texte tel quel, precede de « Erreur lors de la
 * creation du ticket » : l'operateur lisait que SON ticket etait refuse. Rien ne l'etait.
 * Ce cas a son propre message, et l'ecran se recharge de lui-meme.</p>
 */
function signalerEchec(erreur: unknown, prefixe: string): void {
  const message = erreur instanceof Error ? erreur.message : 'Erreur inconnue';
  if (estVersionPerimee(message)) {
    signalerVersionPerimee();
    return;
  }
  toast.error(`${prefixe}: ${message}`);
}

export const useCreateBonLivraison = (handleSuccess?: () => void, handleError?: () => void) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async ({ ticket, restaurant }: { ticket: Ticket; restaurant?: { typeCommission: string; commission: number } }) => {
      const result = await createBonLivraison(ticket, restaurant);
      if (!result.success) {
        console.error(result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
      if (handleSuccess) {
        toast.success('Le ticket a été créé avec succès.');
        handleSuccess();
      }
    },
    onError: (error) => {
      console.error('Erreur création bon de livraison:', error);
      signalerEchec(error, 'Erreur lors de la création du ticket');
      if (handleError) handleError();
    },
  });
};

export const useUpdateBonLivraison = (handleSuccess?: () => void) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async ({ ticketId, ticket, restaurant }: { ticketId: string; ticket: Ticket; restaurant?: { typeCommission: string; commission: number } }) => {
      const result = await updateBonLivraison(ticketId, ticket, restaurant);
      if (!result.success) {
        console.error(result.error);
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
      toast.success('Le bon de livraison a été mis à jour avec succès.');
      if (handleSuccess) {
        handleSuccess();
      }
    },
    onError: (error) => {
      console.error(error);
      signalerEchec(error, 'Erreur lors de la mise à jour du ticket');
    },
  });
};

export const useDeleteBonLivraison = () => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    // `mutationFn` ne prend qu'UNE variable. `deleteBonLivraison(ticketId, motif?)`
    // en declare deux ; on la referme sur l'identifiant seul, ce qui est exactement
    // ce que fait l'unique point d'appel (ticket-table.tsx:161) : `motif` n'a jamais
    // ete transmis. Aucun comportement ne change.
    /*
     * L'ECHEC ETAIT ANNONCE COMME UNE REUSSITE.
     *
     * <p>`deleteBonLivraison` attrape toute erreur et rend `false` au lieu de relancer.
     * La promesse etant RESOLUE, TanStack executait `onSuccess` : invalidation du cache,
     * puis « Le ticket a ete supprime avec succes » en vert. Le `onError` pose chez
     * l'appelant etait du code mort, il ne pouvait jamais partir.</p>
     *
     * <p>Consequence pour l'operateur : le serveur refuse la suppression (role
     * insuffisant, session expiree, panne), il lit un message de succes, le ticket
     * reapparait apres invalidation, il en conclut que l'affichage est en retard,
     * recharge, et le ticket est toujours la. Il ne saura jamais que rien n'a ete
     * supprime.</p>
     *
     * <p>Un `false` devient donc un echec, comme les quatre autres mutations de ce
     * fichier le font deja.</p>
     */
    mutationFn: async (ticketId: string) => {
      const supprime = await deleteBonLivraison(ticketId);
      if (!supprime) throw new Error('La suppression a été refusée par le serveur');
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Le ticket n'a pas été supprimé : ${message}`);
      console.error(error);
    },
  });
};

export const useRestaurerArchives = (
  onSuccessFn?: (restored: Record<string, number>) => void,
  /**
   * Appele que la restauration reussisse ou non.
   *
   * <p>La remise a zero de l'indicateur d'attente vivait dans le rappel de SUCCES. Sur
   * echec, il n'etait donc jamais remis a zero : la modale restait ouverte et son bouton
   * tournait indefiniment, alors que la requete etait terminee depuis longtemps. Rien
   * n'indiquait a l'operateur que la restauration avait echoue, ni ne lui rendait la
   * main pour reessayer ou fermer.</p>
   */
  onSettledFn?: () => void,
) => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: (commandeIds: string[]) => restaurerArchivesRequest(commandeIds),
    onSuccess: async (data, commandeIds) => {
      await invalidateTicketsQuery();
      const count = commandeIds.length;
      toast.success(`${count} ticket(s) restauré(s) avec succès.`);
      onSuccessFn?.(data);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de la restauration: ${message}`);
    },
    onSettled: () => {
      onSettledFn?.();
    },
  });
};

export const useAuthentifierTicket = () => {
  const invalidateTicketsQuery = useInvalidateTicketsQuery();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const result = await authentifierTicket(ticketId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: async () => {
      await invalidateTicketsQuery();
      toast.success('Ticket authentifié avec succès.');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(`Erreur lors de l'authentification: ${message}`);
    },
  });
};
