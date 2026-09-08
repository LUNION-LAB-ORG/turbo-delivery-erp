'use client';

import React from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';

/**
 * Le choix d'une annee, au-dessus d'un graphique.
 *
 * <h3>Ce qui change</h3>
 * <p>Le menu deroulant venait de la SECONDE bibliotheque de composants. Il portait son
 * intitule « Annee » a l'INTERIEUR de la liste, en en-tete de groupe : le champ ferme,
 * lui, n'avait aucun libelle visible. A cote d'un graphique, une liste posee sans nom se
 * lit comme un filtre dont on ignore la nature. L'intitule est devant le champ.</p>
 *
 * <p>La liste est desormais cherchable : trois ans aujourd'hui, mais elle part de 2023 et
 * s'allonge d'une entree par an sans que personne n'y revienne.</p>
 */

interface YearSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  startYear?: number;
  placeholder?: string;
  className?: string;
}

function YearSelect({
  value,
  onChange,
  startYear = 2023,
  placeholder = 'Sélectionner une année',
  className,
}: YearSelectProps) {
  const currentYear = new Date().getFullYear();
  // La plus recente d'abord : c'est celle qu'on regarde.
  const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();

  return (
    <div className={className || 'w-full max-w-48'}>
      <ChampListe
        label="Année"
        onChange={(v) => onChange?.(v)}
        options={years.map((year) => ({ label: String(year), value: String(year) }))}
        placeholder={placeholder}
        valeur={value ?? ''}
      />
    </div>
  );
}

export default YearSelect;
