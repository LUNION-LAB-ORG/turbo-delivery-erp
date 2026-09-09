'use client';

import { useEffect, useState } from 'react';

/**
 * Plancher de secours, volontairement BAS : il ne sert qu'aux fenetres minuscules.
 *
 * <p>Sur la fenetre reelle des postes (1000 x 563, coquille comprise), ce qui est au-dessus
 * du releve - en-tete ERP 64, marge de la coquille 24, titre et gestes, ligne de
 * definition, barre de filtres, bandeau, barre d'onglets - laisse de l'ordre de 200 px.
 * C'est peu, et c'est la place reelle : c'est la MESURE qui tranche, jamais ce plancher.
 * Un plancher plus haut que la place disponible pousserait le bas du cadre sous le pli, et
 * le total general collant redeviendrait invisible - exactement ce qu'on veut eviter.</p>
 */
const HAUTEUR_PLANCHER = 160;

/**
 * Point de rupture `md` de Tailwind, celui auquel le releve bascule du tableau vers les
 * cartes tactiles dans `encours-sections-tabs`. Les deux DOIVENT rester d'accord : mesurer
 * une hauteur pour un tableau qui n'est pas monte n'a aucun sens.
 */
const RUPTURE_TABLEAU = 768;

/** De quoi ne pas coller le total general au bord bas de la fenetre. */
const MARGE_BASSE = 8;

/**
 * Hauteur du cadre de defilement du releve : du haut du bloc jusqu'au PLI.
 *
 * <h3>Pourquoi une mesure locale et pas `useHauteurDisponible`</h3>
 * <p>Le hook partage soustrait la hauteur de ce qui SUIT le bloc dans la page. C'etait le
 * point de desaccord tant que les graphiques et le registre des avances etaient empiles
 * sous le releve ; ils sont maintenant chacun sous leur onglet, plus rien ne suit le
 * releve, et cette soustraction ne gene plus. Ce qui separe encore les deux hooks, c'est
 * le PLANCHER : celui du hook partage vaut 320 px, or la place reellement disponible sous
 * le bandeau tourne autour de 200 px sur la fenetre des postes. Un plancher plus haut que
 * la place disponible ne mesure plus rien, il rend une constante - et cette constante
 * pousse le bas du cadre sous le pli, donc cache le total general.</p>
 *
 * <p>Seconde difference, apparue avec les onglets : le hook partage prend un `RefObject`
 * et son effet ne depend que de lui, donc il ne remesure jamais un noeud remonte. Voir la
 * reference-fonction ci-dessous. Le corriger la-bas engagerait les dix ecrans qui
 * l'utilisent, ce qui n'est pas de ce lot.</p>
 *
 * <p>Consequence voulue : le bas du cadre tombe sur le bas de la fenetre, donc le total
 * general colle en bas du cadre se voit sans faire defiler la page. C'est toute la raison
 * d'avoir un cadre borne plutot qu'un tableau qui s'etire.</p>
 *
 * <h3>Pourquoi une reference-FONCTION et pas un `RefObject`</h3>
 * <p>react-aria DEMONTE les panneaux d'onglet non selectionnes. Un effet qui ne depend que
 * d'un `RefObject` ne se rejoue jamais - l'objet est stable pour la vie du composant - et
 * la dependance seule ne suffit donc pas : depuis un autre onglet, `reference.current`
 * valait `null`, la mesure sortait sans rien faire, et au retour sur le releve le noeud
 * etait NEUF sans que rien redeclenche l'effet. Un redimensionnement de fenetre fait
 * depuis « Repartition » laissait une hauteur perimee jusqu'au redimensionnement suivant.
 * Ranger le noeud dans un ETAT ferme le trou : il change au montage comme au demontage,
 * l'effet suit, et l'observateur se rebranche sur le noeud reel.</p>
 *
 * @returns `hauteur`, en pixels, ou `undefined` sous le point de rupture (le releve y passe
 *          en cartes tactiles, qui gardent leur hauteur naturelle) ; et `zoneReleve`, la
 *          reference a poser sur le bloc a mesurer.
 */
export function useHauteurReleve(): {
  hauteur: number | undefined;
  zoneReleve: (noeud: HTMLElement | null) => void;
} {
  // Le NOEUD, pas une reference : c'est ce changement d'etat qui rejoue la mesure quand le
  // panneau du releve se demonte puis se remonte.
  const [zone, setZone] = useState<HTMLElement | null>(null);
  const [hauteur, setHauteur] = useState<number>();

  useEffect(() => {
    if (!zone) return;

    const mesurer = () => {
      if (window.innerWidth < RUPTURE_TABLEAU) {
        setHauteur(undefined);
        return;
      }

      // Distance depuis le haut du DOCUMENT, et non depuis le haut de la fenetre : prise
      // pendant un defilement, la seconde grandirait, ce qui allongerait le cadre, ce qui
      // permettrait de defiler davantage - une boucle. Ce qui est au-dessus du bloc ne
      // bouge pas quand le bloc change de taille : la mesure est stable.
      const depuisLeHautDuDocument = zone.getBoundingClientRect().top + window.scrollY;
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
  }, [zone]);

  return { hauteur, zoneReleve: setZone };
}
