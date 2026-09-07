'use client';
import App from '@/App';
import store from '@/store';
import { Provider } from 'react-redux';
import React, { ReactNode, Suspense, useState } from 'react';
// import { appWithI18Next } from 'ni18n';
// import { ni18nConfig } from 'ni18n.config.ts';
import Loading from '@/components/layouts/loading';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { estVersionPerimee, signalerVersionPerimee } from '@/lib/version-perimee';

interface IProps {
  children?: ReactNode;
}

const ProviderComponent = ({ children }: IProps) => {
  // LE QUERYCLIENT MONTE N'AVAIT AUCUNE OPTION PAR DEFAUT.
  //
  // Sans staleTime, TanStack considere chaque donnee comme perimee des sa reception et
  // la recharge au moindre retour de focus sur la fenetre : un simple alt-tab sur un
  // poste de saisie relançait la liste des tickets (toutes les pages deja chargees),
  // les statistiques, les livreurs et les notifications. Les bonnes valeurs existaient
  // deja dans lib/get-query-client.ts, mais ce fichier ne sert qu'au rendu serveur —
  // le client, lui, tournait nu.
  //
  // refetchOnWindowFocus est coupe explicitement : avec staleTime a 60 s il ne se
  // declenchait deja plus qu'apres une minute, mais les ecrans qui ont besoin de temps
  // reel posent leur propre refetchInterval, qui n'est pas affecte. Les autres n'ont
  // aucune raison de recharger parce qu'on a change de fenetre.
  // UNE VERSION PERIMEE N'EST PAS UN ECHEC METIER, ET ELLE FRAPPE TOUS LES ECRANS.
  //
  // Les identifiants d'action serveur de Next sont des empreintes de build. Un onglet
  // garde le JavaScript de la version qu'il a chargee ; des qu'un deploiement passe,
  // l'identifiant qu'il appelle n'existe plus et le serveur repond 404. Chaque ecran
  // affichait alors SON message metier : « 0 ticket enregistre, 12 en echec » sur la
  // saisie, « 25 ticket(s) non valide(s) » sur la verification V1. L'operateur cherchait
  // un champ manquant ou un droit refuse. Rien n'etait refuse.
  //
  // Quatre-vingt-huit fichiers posent un `onError` : les corriger un par un etait exclu,
  // et le prochain ecran ecrit aurait recommence. Le filet est donc pose UNE fois, sur le
  // cache de mutations, et couvre tout ce qui appelle une action serveur.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (erreur) => {
            const message = erreur instanceof Error ? erreur.message : String(erreur);
            if (estVersionPerimee(message)) signalerVersionPerimee();
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              if (error?.response?.status === 404) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<Loading />}>
          <App>{children} </App>
        </Suspense>
      </QueryClientProvider>
    </Provider>
  );
};

export default ProviderComponent;
