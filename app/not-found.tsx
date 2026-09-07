'use client';

import { Button } from '@heroui-v3/react';
import { ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

import { LienBouton } from '@/components/commons/LienBouton';

/**
 * L'écran d'une page introuvable.
 *
 * <h3>Ce qui change</h3>
 * <p>Le fichier exportait un `metadata` — Next l'IGNORE dans un composant client, la page
 * n'a donc jamais porté le titre « Error 404 » qu'il annonçait.</p>
 *
 * <p>Le « 404 » était un chiffre de neuf unités de haut, en dégradé du rouge de marque au
 * jaune, écrit en couleurs brutes. Et le texte disait « semble avoir disparu dans
 * l'espace » : sur l'ERP d'une société de livraison, un opérateur qui suit un lien mort
 * n'a pas besoin d'une métaphore, il a besoin de savoir quoi faire.</p>
 *
 * <p>« Accueil » était un `Button as={Link}`, ce qui rend un `&lt;button&gt;` contenant un
 * `&lt;a&gt;` : du HTML invalide, annoncé par les lecteurs d'écran comme un bouton dont le
 * nom est un lien. Et « Retour » portait `onClick`, ignoré en silence par le Button v3.</p>
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-muted uppercase">Erreur 404</p>
        <h1 className="text-3xl font-bold text-foreground">Cette page n&apos;existe pas</h1>
        <p className="text-sm text-muted">
          Le lien est peut-être périmé, ou l&apos;adresse a été saisie à la main. Revenez à
          l&apos;écran précédent, ou repartez de l&apos;accueil.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <LienBouton href="/" variante="primary">
            <Home aria-hidden="true" className="size-4" />
            Accueil
          </LienBouton>
          <Button onPress={() => router.back()} variant="outline">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}
