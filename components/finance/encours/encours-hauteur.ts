'use client';

import { RefObject, useEffect, useState } from 'react';

/**
 * Plancher de secours, volontairement BAS : il ne sert qu'aux fenetres minuscules.
 *
 * <p>Sur la fenetre reelle des postes (1000 x 563, coquille comprise), ce qui est au-dessus
 * du releve - en-tete ERP 64, marge de la coquille 24, titre et gestes, ligne de
 * definition, barre de filtres, bandeau - laisse de l'ordre de 200 px. C'est peu, et c'est
 * la place reelle : c'est la MESURE qui tranche, jamais ce plancher. Un plancher plus haut
 * que la place disponible pousserait le bas du cadre sous le pli, et le total general
 * collant redeviendrait invisible - exactement ce qu'on veut eviter.</p>
 */
const HAUTEUR_PLANCHER = 160;

/**
 * Point de rupture `md` de Tailwind, celui auquel le releve bascule du tableau vers les
 * cartes tactiles dans `encours-view`. Les deux DOIVENT rester d'accord : mesurer une
 * hauteur pour un tableau qui n'est pas monte n'a aucun sens.
 */
const RUPTURE_TABLEAU = 768;

/** De quoi ne pas coller le total general au bord bas de la fenetre. */
const MARGE_BASSE = 8;

/**
 * Hauteur du cadre de defilement du releve : du haut du bloc jusqu'au PLI.
 *
 * <h3>Pourquoi une mesure locale et pas `useHauteurDisponible`</h3>
 * <p>Le hook partage est ecrit pour les ecrans « poste de travail » ou TOUT doit tenir
 * dans la fenetre : il soustrait la hauteur de ce qui suit le bloc dans la page. Or ici
 * les graphiques et le registre des avances sont des freres SUIVANTS, et ils sont poses
 * sous le pli VOLONTAIREMENT - ils se lisent apres, en faisant defiler la page. Avec ce
 * hook, releve sur le banc en 1000 x 563 : haut du bloc 248, freres suivants 445,
 * disponible -130, donc plancher. La hauteur ne mesurait plus rien, elle rendait une
 * constante, et cette constante (320) etait PLUS PETITE que le `max-h-[64vh]` qu'elle
 * remplacait (360). Ici on ne soustrait que ce qui est AU-DESSUS : le cadre s'arrete au
 * pli, ni avant ni apres.</p>
 *
 * <p>Consequence voulue : le bas du cadre tombe sur le bas de la fenetre, donc le total
 * general colle en bas du cadre se voit sans faire defiler la page. C'est toute la raison
 * d'avoir un cadre borne plutot qu'un tableau qui s'etire.</p>
 *
 * @returns la hauteur en pixels, ou `undefined` sous le point de rupture (le releve y
 *          passe en cartes tactiles, qui gardent leur hauteur naturelle).
 */
export function useHauteurReleve(reference: RefObject<HTMLElement | null>): number | undefined {
  const [hauteur, setHauteur] = useState<number>();

  useEffect(() => {
    const mesurer = () => {
      const element = reference.current;
      if (!element) return;

      if (window.innerWidth < RUPTURE_TABLEAU) {
        setHauteur(undefined);
        return;
      }

      // Distance depuis le haut du DOCUMENT, et non depuis le haut de la fenetre : prise
      // pendant un defilement, la seconde grandirait, ce qui allongerait le cadre, ce qui
      // permettrait de defiler davantage - une boucle. Ce qui est au-dessus du bloc ne
      // bouge pas quand le bloc change de taille : la mesure est stable.
      const depuisLeHautDuDocument = element.getBoundingClientRect().top + window.scrollY;
      const disponible = window.innerHeight - depuisLeHautDuDocument - MARGE_BASSE;
      const cible = Math.max(HAUTEUR_PLANCHER, Math.round(disponible));

      // Un ecart d'un pixel (arrondi de rendu) ne justifie pas un nouveau rendu, et evite
      // qu'un aller-retour d'un pixel entretienne l'observateur de redimensionnement.
      setHauteur((precedente) =>
        precedente !== undefined && Math.abs(precedente - cible) <= 1 ? precedente : cible,
      );
    };

    mesurer();
    window.addEventListener('resize', mesurer);

    // Ce qui est au-dessus du releve grandit APRES le premier rendu : la barre de filtres
    // se replie sur deux lignes, le bandeau gagne sa ligne de contexte. Sans observateur,
    // la mesure initiale resterait fausse jusqu'au prochain redimensionnement de fenetre.
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(document.body);

    return () => {
      window.removeEventListener('resize', mesurer);
      observateur.disconnect();
    };
  }, [reference]);

  return hauteur;
}
