'use client';

import { useCallback, useState } from 'react';

export interface Ouverture {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onOpenChange: (ouvert: boolean) => void;
  /** Bascule. Pratique pour un bouton unique qui ouvre et ferme. */
  onToggle: () => void;
}

/**
 * L'ouverture d'une fenêtre : ouverte, fermée, et les trois gestes qui vont avec.
 *
 * <h3>Pourquoi ce hook existe</h3>
 * <p>C'était `useDisclosure` de HeroUI v2, que la v3 ne fournit plus — et sept contrôleurs
 * de l'ERP en dépendent. Le remplacer fenêtre par fenêtre aurait dispersé sept `useState`
 * identiques ; il garde donc exactement la même signature, si bien que la bascule se
 * résume à changer la ligne d'import.</p>
 *
 * <p>Il ajoute `onOpenChange`, qui est la forme attendue par le `Modal` de la v3 : le
 * composant y passe le nouvel état, là où la v2 exposait deux fonctions séparées. Les deux
 * façons cohabitent pour ne rien casser des appelants existants.</p>
 */
export function useOuverture(ouvertParDefaut = false): Ouverture {
  const [isOpen, setIsOpen] = useState(ouvertParDefaut);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen((v) => !v), []);
  const onOpenChange = useCallback((ouvert: boolean) => setIsOpen(ouvert), []);

  return { isOpen, onClose, onOpen, onOpenChange, onToggle };
}
