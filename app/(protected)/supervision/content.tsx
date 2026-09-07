'use client';

import { useCallback, useRef, useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { useAbility } from '@/hooks/use-ability';
import { ActiviteModulesPanel } from '@/features/supervision/components/activite-modules-panel';
import { AdoptionPanel } from '@/features/supervision/components/adoption-panel';
import { ConnexionsPanel } from '@/features/supervision/components/connexions-panel';
import { SessionsEnLignePanel } from '@/features/supervision/components/sessions-en-ligne-panel';
import { SupervisionKpis } from '@/features/supervision/components/supervision-kpis';
import { supervisionKeys, useSupervisionStatsQuery } from '@/features/supervision/queries/supervision.queries';
import { ExporteurOnglet, OngletSupervision } from '@/features/supervision/types';
import EtatErreur from '@/components/commons/EtatErreur';

/**
 * Supervision des sessions & audit global des activités (SPEC-ERP-TURBO-AUDIT-v2.0).
 *
 * <b>Écran en lecture seule</b>, à une exception documentée près : la déconnexion
 * forcée d'une session, réservée aux profils qui peuvent `manage` le sujet CASL
 * Supervision. Aucune donnée d'audit n'est modifiable ni supprimable depuis
 * l'ERP — le backend n'expose d'ailleurs aucune route d'écriture sur les
 * journaux, et les tables portent des triggers PostgreSQL qui refusent tout
 * UPDATE/DELETE.
 */
export function SupervisionContent() {
  const ability = useAbility();
  const { data: sessionAuth } = useSession();
  const userId = sessionAuth?.user?.id ?? '';
  const queryClient = useQueryClient();

  const [onglet, setOnglet] = useState<OngletSupervision>('en-ligne');
  const [exportEnCours, setExportEnCours] = useState(false);

  // Le bouton d'export vit dans l'entête ; chaque panneau y publie sa propre
  // fonction au montage. HeroUI ne monte que l'onglet sélectionné : la fonction
  // présente ici est donc toujours celle de l'onglet visible.
  const exporteurRef = useRef<ExporteurOnglet | null>(null);
  const enregistrerExport = useCallback((exporteur: ExporteurOnglet | null) => {
    exporteurRef.current = exporteur;
  }, []);

  const lancerExport = async () => {
    if (!exporteurRef.current) return;
    setExportEnCours(true);
    try {
      await exporteurRef.current();
    } finally {
      setExportEnCours(false);
    }
  };

  // Le droit est passé au hook : le contrôle d'accès de cet écran est plus bas
  // (les hooks ne peuvent pas être conditionnels), et sans cette garde la page
  // sondait toutes les 30 s même pour quelqu'un qui n'a pas le droit de la lire.
  const {
    data: stats,
    isPending: statsEnCours,
    isError: statsErreur,
    refetch: rechargerStats,
  } = useSupervisionStatsQuery(
    userId,
    ability.can('read', 'Supervision'),
  );

  const peutForcerDeconnexion = ability.can('manage', 'Supervision');

  if (!ability.can('read', 'Supervision')) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-default-400">
        <AlertTriangle className="h-8 w-8" />
        <p>Vous n&apos;avez pas accès à la supervision et à l&apos;audit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Entête */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {/* Le titre etait peint en ROUGE DE MARQUE. */}
          <h1 className="text-2xl font-bold text-foreground">
            Supervision des sessions et audit global
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Présence en temps réel, journal des connexions et traçabilité des actions dans tous les modules de
            l&apos;ERP. Écran en lecture seule : les journaux ne sont ni modifiables ni supprimables, quel que
            soit le profil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button isPending={exportEnCours} onPress={lancerExport} size="sm" variant="outline">
            <Download aria-hidden="true" className="size-4" />
            Exporter l&apos;onglet (CSV)
          </Button>
          <Button
            onPress={() => queryClient.invalidateQueries({ queryKey: supervisionKeys.all })}
            size="sm"
            variant="outline"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Rafraichi toutes les 30 s. Sur echec `stats` restait undefined et les
          compteurs affichaient zero : « aucune activite » plutot que « la lecture
          a echoue ». */}
      {statsErreur ? (
        <EtatErreur quoi="les indicateurs de supervision" onReessayer={() => rechargerStats()} />
      ) : (
        <SupervisionKpis stats={stats} isLoading={statsEnCours} />
      )}

      {/*
       * `ToggleButtonGroup` et non `Tabs` : `Tabs.Indicator` de la v3 fait tomber la page,
       * et sans lui les onglets ne distinguent l'actif que par une nuance de gris.
       */}
      <ToggleButtonGroup
        aria-label="Supervision et audit"
        className="flex-wrap"
        onSelectionChange={(sel) =>
          setOnglet(String(Array.from(sel)[0] ?? 'en-ligne') as OngletSupervision)
        }
        selectedKeys={new Set([onglet])}
        selectionMode="single"
      >
        <ToggleButton id="en-ligne">Utilisateurs en ligne</ToggleButton>
        <ToggleButton id="activite">Activité des modules</ToggleButton>
        <ToggleButton id="connexions">Connexions</ToggleButton>
        <ToggleButton id="adoption">Premières connexions</ToggleButton>
      </ToggleButtonGroup>

      {/*
       * Les quatre panneaux restent MONTES, caches par `hidden`.
       *
       * <p>L'ancien `Tabs` demontait le panneau inactif : revenir sur « Utilisateurs en
       * ligne » relancait sa requete et repartait d'un ecran vide, sur un tableau de bord
       * qu'on consulte precisement en passant d'un onglet a l'autre.</p>
       */}
      <div hidden={onglet !== 'en-ligne'}>
        <SessionsEnLignePanel
          enregistrerExport={enregistrerExport}
          peutForcerDeconnexion={peutForcerDeconnexion}
          userId={userId}
        />
      </div>
      <div hidden={onglet !== 'activite'}>
        <ActiviteModulesPanel enregistrerExport={enregistrerExport} userId={userId} />
      </div>
      <div hidden={onglet !== 'connexions'}>
        <ConnexionsPanel enregistrerExport={enregistrerExport} userId={userId} />
      </div>
      <div hidden={onglet !== 'adoption'}>
        <AdoptionPanel enregistrerExport={enregistrerExport} userId={userId} />
      </div>
    </div>
  );
}

export default SupervisionContent;
