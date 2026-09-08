'use client';

import { ChampListe } from '@/components/commons/champs-formulaire';

/**
 * Le choix de l'annee, au-dessus du graphique financier.
 *
 * <h3>Ce qui change</h3>
 * <p>Le menu deroulant venait de la SECONDE bibliotheque. Son intitule « Annees
 * disponibles » etait un en-tete de groupe A L'INTERIEUR de la liste : le champ ferme
 * n'affichait que « Année: » ecrit a cote, en texte nu, jamais rattache au champ. Un
 * lecteur d'ecran annoncait donc une liste sans nom. L'intitule est porte par le champ.</p>
 *
 * <p>La liste est cherchable, comme partout ailleurs dans l'ERP, et la plus recente vient
 * en premier : c'est l'annee qu'on regarde.</p>
 *
 * <p>Le pictogramme de calendrier a cote du mot « Année » decorait le mot lui-meme.</p>
 */

interface YearFilterProps {
  isLoading?: boolean;
  onYearChange: (year: number) => void;
  selectedYear: number;
}

export function YearFilter({ isLoading = false, onYearChange, selectedYear }: YearFilterProps) {
  // Depuis 2020 et jusqu'a l'annee prochaine : une paie de janvier se rapproche de
  // l'exercice suivant avant qu'il ne commence.
  const anneeCourante = new Date().getFullYear();
  const annees = Array.from({ length: anneeCourante - 2019 + 2 }, (_, i) => 2020 + i).reverse();

  return (
    <div className="flex items-end gap-3">
      <div className="w-40">
        <ChampListe
          estDesactive={isLoading}
          label="Année"
          onChange={(v) => v && onYearChange(Number(v))}
          options={annees.map((annee) => ({ label: String(annee), value: String(annee) }))}
          placeholder="Sélectionner une année"
          valeur={String(selectedYear)}
        />
      </div>

      {/* La lecture est en cours : le dire evite de croire que le graphique est a jour. */}
      {isLoading && <span className="pb-2 text-sm text-muted">Chargement…</span>}
    </div>
  );
}
