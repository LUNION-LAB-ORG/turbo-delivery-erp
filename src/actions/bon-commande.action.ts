'use server';

import { apiClientHttp } from '@/lib/api-client-http';
import { PaginatedResponse } from '@/types';
import { BonLivraison, BonLivraisonTerminee, ParametreBonLivraisonFacture, Ticket } from '@/types/bon-livraison.model';
import { formatDate } from '@/utils/date-formate';
/**
 * Une plage de dates, telle que le serveur l'attend.
 *
 * <p>Ce module est une action SERVEUR : il n'a rien a faire d'une bibliotheque de
 * composants. Il en importait pourtant `RangeValue`, un type de deux champs, ce qui
 * accrochait tout `@heroui/react` a la chaine de dependances du serveur. La forme
 * tient en une ligne, on la declare ici. Meme convention que
 * `facturation-plage-view.tsx`, ou la v3 a impose le meme choix.</p>
 */
type PlageDates<T> = { end: T; start: T };
import axios from 'axios';
import { ApiResult } from '@/types/general';
import { handleApiError } from '@/utils/handle-api-error';
import { auth } from '@/auth';
import { authentifierTicketRequest, validerV1Request, validerV2Request, validerV2EnMasseRequest, approuverTicketRequest, rejeterFraudeRequest, deleteBonLivraisonRequest } from '@/features/tickets/request/tickets.request';
// Configuration
const BASE_URL = '/api/erp/bon-livraison';
const BASE_URL_2 = '/api/export/reporting';

const bonLivraisonEndpoints = {
  getBonLivraisonAll: {
    endpoint: `${BASE_URL}/tous`,
    method: 'GET',
  },
  bonLivraisonTerminers: { endpoint: `${BASE_URL}/tous-termines`, method: 'GET' },
  bonLivraisonTerminees: { endpoint: `${BASE_URL}/tous/termines`, method: 'GET' },
  bonLivraisonEnAttentes: { endpoint: `${BASE_URL}/tous-attentes`, method: 'GET' },
  reportingBonLivraison: { endpoint: `${BASE_URL_2}/facture-bon-livraison`, method: 'POST' },
  create: { endpoint: `${BASE_URL}/create`, method: 'POST' },
  update: { endpoint: `${BASE_URL}/update`, method: 'PUT' },
  delete: {
    endpoint: (id: string) => `${BASE_URL}/${id}`,
    method: 'DELETE',
  },
};

export async function getBonLivraisonAll(page: number, size: number, { dates: { start, end } }: { dates: PlageDates<string | null> }): Promise<PaginatedResponse<BonLivraison> | null> {
  try {
    return await apiClientHttp.request({
      endpoint: bonLivraisonEndpoints.getBonLivraisonAll.endpoint,
      method: bonLivraisonEndpoints.getBonLivraisonAll.method,
      params: {
        page: String(page),
        size: String(size),
        debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
        fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
      },
      service: 'backend',
    });
  } catch (error: any) {
    // Une panne de lecture rendait `null`, indiscernable d'une page sans resultat :
    // le tableau des bons de livraison annoncait "aucun bon" sur la periode alors
    // que rien n'avait pu etre lu.
    throw error;
  }
}

export async function getAllBonLivraisonTerminers(page: number, size: number, { dates: { start, end } }: { dates: PlageDates<string | null> }, typeCommsion: string): Promise<BonLivraison[]> {
  try {
    return await apiClientHttp.request<BonLivraison[]>({
      endpoint: bonLivraisonEndpoints.bonLivraisonTerminers.endpoint,
      method: bonLivraisonEndpoints.bonLivraisonTerminers.method,
      params: {
        page: page.toString(),
        size: size.toString(),
        debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
        fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
        type: typeCommsion,
      },
    });
  } catch (error) {
    // La liste vide masquait la panne : l'ecran des bons termines affichait "aucun
    // resultat" pour la periode, et l'operateur en concluait qu'il n'y avait rien a
    // facturer alors que la lecture avait echoue.
    throw error;
  }
}

export async function getBonLivraisonTerminees({ dates: { start, end } }: { dates: PlageDates<string | null> }): Promise<BonLivraisonTerminee[]> {
  try {
    return await apiClientHttp.request<BonLivraisonTerminee[]>({
      endpoint: bonLivraisonEndpoints.bonLivraisonTerminees.endpoint,
      method: bonLivraisonEndpoints.bonLivraisonTerminees.method,
      params: { debut: start ? formatDate(start, 'YYYY-MM-DD') : '', fin: end ? formatDate(end, 'YYYY-MM-DD') : '' },
    });
  } catch (error) {
    // Sans relance, un service muet se lisait comme un vide reel : zero bon termine
    // sur la plage de dates, donc zero ligne a reporter en facturation.
    throw error;
  }
}

export async function getAllBonLivraisonEnAttentes(
  page: number = 0,
  size: number = 10,
  { dates: { start, end } }: { dates: PlageDates<string | null> },
  typeCommsion: string,
): Promise<BonLivraison[]> {
  try {
    return await apiClientHttp.request<BonLivraison[]>({
      endpoint: bonLivraisonEndpoints.bonLivraisonEnAttentes.endpoint,
      method: bonLivraisonEndpoints.bonLivraisonEnAttentes.method,
      params: {
        page: page.toString(),
        size: size.toString(),
        debut: start ? formatDate(start, 'YYYY-MM-DD') : '',
        fin: end ? formatDate(end, 'YYYY-MM-DD') : '',
        type: typeCommsion,
      },
    });
  } catch (error) {
    // Un echec de lecture se presentait comme une file d'attente vide : plus aucun bon
    // en attente a l'ecran, donc rien a controler pour l'operateur.
    throw error;
  }
}

export async function reportingBonLivraisonTerminers(parametre: ParametreBonLivraisonFacture): Promise<any | null> {
  try {
    const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BACKEND_URL}${bonLivraisonEndpoints.reportingBonLivraison.endpoint}`, parametre, {
      responseType: 'arraybuffer',
    });
    return response.data;
  } catch (error: any) {
    // Pas de relance : ce catch rend une valeur METIER que l'appelant teste
    // (`result?.status === 'error'` dans components/ticket-terminers/controller.tsx),
    // relancer supprimerait le message du serveur affiche a l'export.
    if (error?.response?.data && error.response?.data?.message) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? 'Erreur lors du traitement',
      };
    } else if (error?.response?.data?.message) {
      return {
        status: 'error',
        message: error?.response?.data?.message ?? 'Erreur lors du traitement',
      };
    } else {
      return {
        status: 'error',
        message: 'Erreur lors du traitement',
      };
    }
  }
}

/**
 * Un montant, tel que le serveur l'accepte.
 *
 * <h3>Pourquoi</h3>
 * <p>Une ligne neuve part avec `montantCommande: ''`. Le champ, lui, AFFICHE
 * `Number('') || 0`, donc un zero : l'operateur voit 0 et croit le montant renseigne.
 * S'il ne touche jamais au champ, `onChange` ne part pas et la chaine vide reste.</p>
 *
 * <p>Jackson convertit `""` en `null` pour un `BigDecimal`. Le `@NotNull` du
 * `BonLivraisonDto` refuse alors la ligne avec « Le montant de la commande est
 * obligatoire ». L'ecran affichait donc 0 et refusait d'enregistrer 0.</p>
 *
 * <p>Et il y a bien des tickets sans montant de commande. Le backend le sait deja :
 * `hydrateCommande` fait `setPrix(Optional.ofNullable(montantCommande).orElse(ZERO))`.
 * Envoyer 0 aboutit donc exactement au meme enregistrement que si le champ avait ete
 * facultatif — sans toucher au contrat de l'API ni redeployer le backend.</p>
 */
function montantEnvoye(valeur: unknown): number {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : 0;
}

/**
 * Calculer la commission correctement avant l'envoi
 */
function calculateFinalCommission(ticket: Ticket, restaurant?: { typeCommission: string; commission: number }): number {
  const montantCommande = Number(ticket.montantCommande || 0);

  if (!restaurant || !montantCommande) {
    return 0;
  }

  const commission = Number(restaurant.commission ?? 0);

  if (restaurant.typeCommission === 'POURCENTAGE') {
    const calculatedCommission = montantCommande * (commission / 100);
    return Number(calculatedCommission.toFixed(2));
  }

  // Si c'est un montant fixe
  return commission;
}

/**
 * Créer un nouveau bon de livraison
 */
export async function createBonLivraison(ticket: Ticket, restaurant?: { typeCommission: string; commission: number }): Promise<ApiResult<BonLivraisonTerminee>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');

    const { id, code, ...rest } = ticket;

    // ✅ Calcul correct de la commission au moment de l'envoi
    const finalCommission = calculateFinalCommission(ticket, restaurant);

    const payload = {
      ...rest,
      reference: code,
      // Un champ laisse vide vaut ZERO, pas « rien » : voir `montantEnvoye`.
      montantCommande: montantEnvoye(ticket.montantCommande),
      montantLivraison: montantEnvoye(ticket.montantLivraison),
      commission: finalCommission,
      coutLivraison: finalCommission,
    };

    const resp = await apiClientHttp.request<BonLivraisonTerminee>({
      endpoint: bonLivraisonEndpoints.create.endpoint,
      method: bonLivraisonEndpoints.create.method,
      service: 'backend',
      data: payload,
      config: { headers: { 'X-User-Id': userId } },
    });
    return {
      success: true,
      data: resp,
      message: 'Ticket créé avec succès',
    };
  } catch (error) {
    console.log(error);
    return handleApiError(error, 'Erreur lors de la création du bon de livraison');
  }
}

/**
 * Mettre à jour un bon de livraison existant
 */
export async function updateBonLivraison(ticketId: string, ticket: Ticket, restaurant?: { typeCommission: string; commission: number }): Promise<ApiResult<BonLivraisonTerminee>> {
  try {
    const { id, code, ...rest } = ticket;

    // ✅ Calcul correct de la commission au moment de l'envoi
    const finalCommission = calculateFinalCommission(ticket, restaurant);

    const payload = {
      ...rest,
      reference: code,
      // Un champ laisse vide vaut ZERO, pas « rien » : voir `montantEnvoye`.
      montantCommande: montantEnvoye(ticket.montantCommande),
      montantLivraison: montantEnvoye(ticket.montantLivraison),
      commission: finalCommission,
      coutLivraison: finalCommission,
    };

    const resp = await apiClientHttp.request<BonLivraisonTerminee>({
      endpoint: bonLivraisonEndpoints.update.endpoint,
      method: bonLivraisonEndpoints.update.method,
      service: 'backend',
      data: { id: ticketId, ...payload },
    });
    return {
      success: true,
      data: resp,
      message: 'Ticket mis à jour avec succès',
    };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la mise à jour du bon de livraison');
  }
}

/**
 * Valider V1 un ticket (DGA — B08b, AUTHENTIFIE → V1_VALIDE)
 */
export async function validerV1Ticket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await validerV1Request(ticketId, userId);
    return { success: true, message: 'Ticket validé V1 avec succès' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la validation V1 du ticket');
  }
}

/**
 * Valider V2 un ticket (Responsable V&A — verrouillage irréversible)
 */
export async function validerV2Ticket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await validerV2Request(ticketId, userId);
    return { success: true, message: 'Ticket validé V2 avec succès' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la validation V2 du ticket');
  }
}

/**
 * Authentifier un ticket (Kader — B08)
 */
export async function authentifierTicket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    
    await authentifierTicketRequest(ticketId, userId);
    return { success: true, message: 'Ticket authentifié avec succès' };
  } catch (error) {
    return handleApiError(error, "Erreur lors de l'authentification du ticket");
  }
}

export async function approuverTicket(ticketId: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await approuverTicketRequest(ticketId, userId);
    return { success: true, message: 'Ticket approuvé avec succès' };
  } catch (error) {
    return handleApiError(error, "Erreur lors de l'approbation du ticket");
  }
}

export async function validerV2EnMasseTicket(): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await validerV2EnMasseRequest(userId);
    return { success: true, message: 'Tickets validés V2 en masse avec succès' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors de la validation V2 en masse');
  }
}

export async function rejeterTicketPourFraude(ticketId: string, motif: string): Promise<ApiResult<void>> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');
    await rejeterFraudeRequest(ticketId, userId, motif);
    return { success: true, message: 'Ticket rejeté pour fraude' };
  } catch (error) {
    return handleApiError(error, 'Erreur lors du rejet pour fraude');
  }
}

/**
 * Supprimer un bon de livraison
 */
export async function deleteBonLivraison(ticketId: string, motif?: string): Promise<boolean> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) throw new Error('Utilisateur non authentifié');

    await deleteBonLivraisonRequest(ticketId, userId, motif);
    return true;
  } catch (error) {
    // Pas de relance : c'est une ECRITURE. Son `false` remonte dans une mutation
    // TanStack qui le prend pour un succes (invalidation + toast "supprime"), defaut
    // reel mais d'une autre nature, a corriger chez l'appelant.
    console.error('Erreur suppression:', error);
    return false;
  }
}
