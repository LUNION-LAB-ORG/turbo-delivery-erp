// features/tickets/hooks/use-new-tickets.ts
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '@/types/bon-livraison.model';
import { Restaurant } from '@/types/models';
import { applyTicketPatch, getRestaurantInfo } from '@/features/tickets/utils/commission.utils';

interface Option { value: string; label: string }

interface UseNewTicketsParams {
  restaurants: Restaurant[];
  livreurOptions: Option[];
  restaurantOptions: Option[];
  createBonLivraisonMutation: (
    vars: { ticket: Ticket; restaurant?: { typeCommission: string; commission: number } },
    callbacks?: { onSuccess?: () => void },
  ) => void;
  /**
   * La version qui REND une promesse. Indispensable pour enregistrer un lot : les
   * rappels par appel ne survivent pas a plusieurs `mutate` d'affilee sur la meme
   * instance, alors qu'un `await` sait exactement ce qui a reussi.
   */
  createBonLivraisonAsync: (
    vars: { ticket: Ticket; restaurant?: { typeCommission: string; commission: number } },
  ) => Promise<unknown>;
}

/**
 * Ou l'on garde les lignes en cours de saisie, le temps d'un rechargement.
 *
 * <p>Elles ne vivaient que dans l'etat React. Or le seul remede a une version perimee
 * est de RECHARGER la page : conseiller le rechargement revenait donc a faire retaper
 * douze lignes. Elles sont desormais gardees dans le navigateur — sur ce poste, pour cet
 * operateur, et nulle part ailleurs — et reprises au retour.</p>
 */
const CLE_BROUILLON = 'turbo-erp:tickets-en-saisie';

export function useNewTickets({
  restaurants,
  livreurOptions,
  restaurantOptions,
  createBonLivraisonMutation,
  createBonLivraisonAsync,
}: UseNewTicketsParams) {
  const [newTickets, setNewTickets] = useState<Ticket[]>([]);
  // Ne pas ecrire avant d'avoir lu : le premier rendu a la liste vide, et il ecraserait
  // le brouillon qu'on s'apprete justement a reprendre.
  const brouillonLu = useRef(false);

  useEffect(() => {
    try {
      const garde = window.localStorage.getItem(CLE_BROUILLON);
      if (garde) {
        const lignes = JSON.parse(garde);
        if (Array.isArray(lignes) && lignes.length > 0) setNewTickets(lignes);
      }
    } catch {
      // Navigation privee, stockage bloque : on repart d'une liste vide, sans bruit.
    }
    brouillonLu.current = true;
  }, []);

  useEffect(() => {
    if (!brouillonLu.current) return;
    try {
      if (newTickets.length > 0) {
        window.localStorage.setItem(CLE_BROUILLON, JSON.stringify(newTickets));
      } else {
        window.localStorage.removeItem(CLE_BROUILLON);
      }
    } catch {
      // Le brouillon est un confort, jamais une condition : son echec ne doit rien casser.
    }
  }, [newTickets]);

  // Insert bar state
  const [insertCount, setInsertCount] = useState<number>(1);
  const [insertLivreurId, setInsertLivreurId] = useState<string>('');
  const [insertRestaurantId, setInsertRestaurantId] = useState<string>('');
  const [insertDate, setInsertDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const newTicketIds = useMemo(() => new Set(newTickets.map((t) => t.id)), [newTickets]);

  const handleInsert = useCallback(() => {
    if (insertCount <= 0) return;
    const livreurLabel = livreurOptions.find((l) => l.value === insertLivreurId)?.label ?? '';
    const restaurantLabel = restaurantOptions.find((r) => r.value === insertRestaurantId)?.label ?? '';

    const tickets: Ticket[] = Array.from({ length: insertCount }).map(() => ({
      id: uuidv4(),
      reference: '',
      livreurId: insertLivreurId,
      livreur: livreurLabel,
      restaurantId: insertRestaurantId,
      restaurant: restaurantLabel,
      montantCommande: '',
      montantLivraison: '',
      coutLivraison: '',
      date: insertDate || new Date().toISOString().split('T')[0],
      heure: new Date().toLocaleTimeString('fr-FR'),
      isNew: true,
      isEditing: true,
      statut: 'TERMINE',
    }));

    setNewTickets((prev) => [...tickets, ...prev]);
  }, [insertCount, insertLivreurId, insertRestaurantId, insertDate, livreurOptions, restaurantOptions]);

  const handleSaveNewTicket = useCallback(
    (id: string) => {
      const ticket = newTickets.find((t) => t.id === id);
      if (!ticket) return;
      createBonLivraisonMutation(
        { ticket, restaurant: getRestaurantInfo(ticket.restaurantId, restaurants) },
        { onSuccess: () => setNewTickets((prev) => prev.filter((t) => t.id !== id)) },
      );
    },
    [newTickets, createBonLivraisonMutation, restaurants],
  );

  /**
   * Enregistrer PLUSIEURS lignes d'un coup.
   *
   * <p>Appeler `handleSaveNewTicket` en boucle ne marche pas, et le defaut est
   * silencieux. Les N appels visent la MEME instance de mutation : a chaque appel,
   * `MutationObserver.mutate()` retire l'observateur de la mutation precedente et
   * remplace ses options. Seul le rappel du DERNIER appel est notifie. Les N tickets
   * partent bien au serveur et y sont crees, mais une seule ligne quitte l'ecran.</p>
   *
   * <p>Ce que voyait l'operateur : une liasse de douze part, douze tickets sont crees,
   * onze lignes restent affichees et cochees completes. Il en conclut a un echec,
   * reclique, et cree onze doublons — donc onze commissions partenaire et onze lignes
   * de paie comptees deux fois, sans contrainte en base pour l'arreter.</p>
   *
   * <p>On enchaine donc les envois un par un, on collecte les identifiants REUSSIS, et
   * on ne retire de l'etabli que ceux-la, en une seule mise a jour. Une ligne dont
   * l'envoi echoue reste a l'ecran : c'est precisement ce qu'on veut voir.</p>
   */
  const handleSaveNewTickets = useCallback(
    async (ids: string[]) => {
      const aEnvoyer = newTickets.filter((t) => ids.includes(t.id));
      if (aEnvoyer.length === 0) return { echoues: 0, raisons: [], reussis: 0 };

      const reussis: string[] = [];
      /*
       * On collecte la RAISON de chaque echec.
       *
       * <p>Le lot ne rendait qu'un compte : « 0 enregistre, 7 en echec ». L'operateur
       * voyait sept lignes refusees sans savoir laquelle poser la question — un champ
       * manquant ? le serveur ? son droit ? Les rappels `onError` de la mutation
       * empilaient bien sept notifications, mais elles se recouvrent et disparaissent.
       * La raison remonte donc avec le resultat, et s'affiche a cote du compte.</p>
       */
      const raisons: string[] = [];
      for (const ticket of aEnvoyer) {
        try {
          await createBonLivraisonAsync({
            ticket,
            restaurant: getRestaurantInfo(ticket.restaurantId, restaurants),
          });
          reussis.push(ticket.id);
        } catch (erreur) {
          const message = erreur instanceof Error ? erreur.message : String(erreur);
          if (message && !raisons.includes(message)) raisons.push(message);
        }
      }

      if (reussis.length > 0) {
        setNewTickets((prev) => prev.filter((t) => !reussis.includes(t.id)));
      }
      return {
        echoues: aEnvoyer.length - reussis.length,
        raisons,
        reussis: reussis.length,
      };
    },
    [newTickets, createBonLivraisonAsync, restaurants],
  );

  const handleCancelNewTicket = useCallback((id: string) => {
    setNewTickets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleNewTicketChange = useCallback(
    (id: string, field: keyof Ticket, value: string) => {
      setNewTickets((prev) =>
        prev.map((t) => (t.id === id ? applyTicketPatch(t, { [field]: value }, restaurants) : t)),
      );
    },
    [restaurants],
  );

  const handleNewTicketPatch = useCallback(
    (id: string, patch: Partial<Ticket>) => {
      setNewTickets((prev) =>
        prev.map((t) => (t.id === id ? applyTicketPatch(t, patch, restaurants) : t)),
      );
    },
    [restaurants],
  );

  return {
    newTickets,
    newTicketIds,
    insertState: { insertCount, insertLivreurId, insertRestaurantId, insertDate, setInsertCount, setInsertLivreurId, setInsertRestaurantId, setInsertDate },
    handleInsert,
    handleSaveNewTicket,
    handleSaveNewTickets,
    handleCancelNewTicket,
    handleNewTicketChange,
    handleNewTicketPatch,
  };
}
