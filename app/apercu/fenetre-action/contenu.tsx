'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';

/**
 * Banc de la coquille de dialogue.
 *
 * <p>Quatorze fenêtres de l'ERP la montent, dont toutes celles qui engagent de l'argent.
 * Trois défauts y ont été corrigés et se regardent ici : l'action ne pouvait pas être
 * neutralisée, la croix de fermeture restait vivante pendant une action, et l'attente
 * ne se voyait pas.</p>
 */
export default function ApercuFenetreAction() {
  const [cas, setCas] = React.useState<'attente' | 'ferme' | 'inactive' | 'normal'>('ferme');

  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-semibold">Banc de la fenêtre d&apos;action</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Trois états à vérifier : l&apos;action neutralisée doit être grisée et inerte,
        l&apos;attente doit se voir, et la croix doit suivre l&apos;attente.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button onPress={() => setCas('normal')} size="sm" variant="primary">
          Normale
        </Button>
        <Button onPress={() => setCas('inactive')} size="sm" variant="ghost">
          Action neutralisée
        </Button>
        <Button onPress={() => setCas('attente')} size="sm" variant="ghost">
          Action en attente
        </Button>
      </div>

      <FenetreAction
        actionInactive={cas === 'inactive'}
        destructif
        enAttente={cas === 'attente'}
        libelleAction={cas === 'attente' ? 'Encaissement…' : 'Encaisser 0 facture(s)'}
        onAction={() => undefined}
        onFermer={() => setCas('ferme')}
        ouvert={cas !== 'ferme'}
        titre="Encaisser la sélection à 100%"
      >
        <p className="text-sm text-muted">Aucune facture éligible sélectionnée.</p>
      </FenetreAction>
    </div>
  );
}
