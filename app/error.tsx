'use client';

import { Button } from '@heroui-v3/react';
import { Home, RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';

import { LienBouton } from '@/components/commons/LienBouton';

/**
 * L'écran d'une erreur serveur.
 *
 * <h3>Ce qui change</h3>
 * <p>Le « 500 » était un chiffre de neuf unités de haut, en dégradé du rouge de danger au
 * rouge de marque : la moitié de l'écran occupée par un nombre que personne ne peut
 * exploiter, au-dessus de la seule phrase utile. Il reste, plus petit, au-dessus de ce
 * qu'on est venu lire.</p>
 *
 * <p>Les deux boutons portaient `onClick`, que le Button v3 ignore EN SILENCE. Ils sont
 * passés à `onPress`, et « Accueil » est devenu un vrai lien : sur la page où
 * l'application est tombée, la sortie doit fonctionner même si React ne reprend pas la
 * main.</p>
 *
 * <p>Les trois animations d'entrée en cascade — 0 ms, 200 ms, 400 ms, 600 ms — faisaient
 * apparaître le message d'erreur APRÈS le chiffre, et le code de référence en dernier.
 * Sur un écran qu'on n'atteint que quand quelque chose ne va pas, on ne fait pas attendre.</p>
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-muted uppercase">Erreur 500</p>
        <h1 className="text-3xl font-bold text-foreground">Le serveur n&apos;a pas répondu</h1>
        <p className="text-sm text-muted">
          Une erreur inattendue s&apos;est produite. Réessayez : votre session reste ouverte.
          Si cela persiste, signalez-le.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onPress={() => reset()} variant="primary">
            <RefreshCcw aria-hidden="true" className="size-4" />
            Réessayer
          </Button>
          {/*
           * Un vrai `<a href>`, pas un bouton qui pousse l'historique : on est sur l'ecran
           * d'une panne, et la sortie doit tenir meme si le routeur ne repond plus.
           */}
          <LienBouton href="/" variante="outline">
            <Home aria-hidden="true" className="size-4" />
            Accueil
          </LienBouton>
        </div>

        {error.digest && (
          <p className="text-xs text-muted">
            Référence à citer : <span className="font-mono">{error.digest}</span>
          </p>
        )}
      </div>
    </div>
  );
}
