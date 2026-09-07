'use client';

import { Button } from '@heroui-v3/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { FenetreAction } from '@/components/commons/FenetreAction';

import TableCreneauDetail from '../performance-apercu/table-creneau-detail';

/**
 * Le détail des gains d'un livreur, jour par jour.
 *
 * <h3>Ce qui change</h3>
 * <p>C'était la douzième copie de la même coquille `@headlessui` : deux `TransitionChild`
 * avec leurs huit classes d'animation recopiées, un fond `bg-[black]/60` écrit en dur, un
 * panneau en `text-black dark:text-white-dark` — un jeton hérité que le thème ne suit
 * plus — et une croix de fermeture faite d'un `&lt;button&gt;` nu sans nom accessible.
 * Elle passe par `FenetreAction`, comme les onze autres.</p>
 *
 * <p>Une `Card` était posée DANS la fenêtre : un cadre à l'intérieur d'un cadre, avec sa
 * propre ombre et ses propres bords.</p>
 *
 * <p>Les deux flèches de navigation n'avaient pas de nom : un lecteur d'écran annonçait
 * deux boutons vides. Elles ne se désactivaient pas non plus en bout de semaine — cliquer
 * ne faisait rien, sans le dire. Elles portaient `onClick`, que le bouton de la
 * bibliothèque n'écoute pas ; il attend `onPress`.</p>
 *
 * <p>Elles étaient posées sur un `bg-slate-300`, une couleur brute sans variante sombre :
 * en thème sombre, un bloc gris clair au milieu de la fenêtre.</p>
 *
 * <p>⚠ Le bouton « imprimer » du pied n'avait AUCUN gestionnaire. Il n'imprimait rien, et
 * n'a jamais rien imprimé. Il est retiré plutôt que laissé à cliquer dans le vide.</p>
 */

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];

interface props {
  gainsData: PerformanceApercuGlobalGain | null;
  jour: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function DropDownPerformanceCrenea({ gainsData, jour, open, setOpen }: props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [data, setData] = useState<JourGain | null>(gainsData?.gains[0] || null);

  useEffect(() => {
    const index = JOURS.indexOf(jour ?? '');
    setCurrentIndex(index === -1 ? 0 : index);
  }, [gainsData, jour]);

  useEffect(() => {
    if (gainsData) setData(gainsData.gains[currentIndex]);
  }, [gainsData, currentIndex]);

  const dernier = (gainsData?.gains.length ?? 0) - 1;

  return (
    <FenetreAction
      libelleFermer="Fermer"
      onFermer={() => setOpen(false)}
      ouvert={open}
      titre={data?.date ? `Gains du ${data.date}` : 'Gains du jour'}
    >
      <div className="flex items-center justify-center gap-3">
        <Button
          aria-label="Jour précédent"
          isDisabled={currentIndex <= 0}
          isIconOnly
          onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          size="sm"
          variant="ghost"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <span className="min-w-28 text-center text-sm font-semibold text-foreground">
          {data?.jour}
        </span>
        <Button
          aria-label="Jour suivant"
          isDisabled={currentIndex >= dernier}
          isIconOnly
          onPress={() => setCurrentIndex((i) => Math.min(dernier, i + 1))}
          size="sm"
          variant="ghost"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>

      <TableCreneauDetail initialData={data?.gain.gains || []} />
    </FenetreAction>
  );
}
