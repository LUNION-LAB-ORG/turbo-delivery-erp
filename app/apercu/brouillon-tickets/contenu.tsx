'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';
import { toast } from 'sonner';

import { useNewTickets } from '@/features/tickets/hooks/use-new-tickets';
import {
  estVersionPerimee,
  MESSAGE_VERSION_PERIMEE,
} from '@/features/tickets/utils/version-perimee';
import type { Restaurant } from '@/types/models';

/**
 * Banc du brouillon de saisie.
 *
 * <p>Deux choses à voir. D'abord que les lignes en cours de saisie SURVIVENT à un
 * rechargement : sans cela, conseiller « rechargez la page » ferait retaper douze
 * lignes. Ensuite que l'échec d'une version périmée se lit comme ce qu'il est, et non
 * comme un décompte de tickets refusés.</p>
 */

const RESTAURANTS: Restaurant[] = [];
const LIVREURS = [{ label: 'Kouamé Yannick Kouadio', value: 'l1' }];
const PARTENAIRES = [{ label: 'AGHA ZONE 4', value: 'r1' }];

const MESSAGE_REEL =
  'Server Action "60a52871aef3a41b9890b5a3002ac859a2e0fe1f87" was not found on the server. Read more: https://nextjs.org/docs/messages/failed-to-find-server-action';

export default function ApercuBrouillonTickets() {
  const n = useNewTickets({
    createBonLivraisonAsync: async () => undefined,
    createBonLivraisonMutation: () => undefined,
    livreurOptions: LIVREURS,
    restaurantOptions: PARTENAIRES,
    restaurants: RESTAURANTS,
  });

  React.useEffect(() => {
    n.insertState.setInsertLivreurId('l1');
    n.insertState.setInsertRestaurantId('r1');
    // Une seule fois au montage : régler la barre d'insertion, pas la piloter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simulerVersionPerimee = () => {
    if (!estVersionPerimee(MESSAGE_REEL)) {
      toast.warning('Non reconnu — le message serait affiché comme un échec métier.');
      return;
    }
    toast.error(MESSAGE_VERSION_PERIMEE, {
      action: { label: 'Recharger', onClick: () => window.location.reload() },
      description: 'Vos lignes sont conservées, vous les retrouverez après le rechargement.',
      duration: Infinity,
    });
  };

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-semibold">Banc du brouillon de saisie</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Ajoutez des lignes, rechargez la page : elles doivent revenir. Le second bouton
        rejoue le message exact remonté de production.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button onPress={n.handleInsert} size="sm" variant="primary">
          Ajouter une ligne
        </Button>
        <Button onPress={simulerVersionPerimee} size="sm" variant="ghost">
          Rejouer l&apos;échec de version périmée
        </Button>
        <Button onPress={() => window.location.reload()} size="sm" variant="ghost">
          Recharger
        </Button>
        <Button
          onPress={() => n.newTickets.forEach((t) => n.handleCancelNewTicket(t.id))}
          size="sm"
          variant="ghost"
        >
          Tout vider
        </Button>
      </div>

      <p className="text-sm">
        Lignes en saisie <span className="font-semibold tabular-nums">{n.newTickets.length}</span>
      </p>
      <ul className="mt-2 text-xs tabular-nums text-muted">
        {n.newTickets.map((t) => (
          <li key={t.id}>{t.id}</li>
        ))}
      </ul>
    </div>
  );
}
