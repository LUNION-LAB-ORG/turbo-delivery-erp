'use client';

import { ChampListe } from '@/components/commons/champs-formulaire';
import { CreerEntreeCaisseModal } from '@/components/finance/entrees-caisse/creer-entree-caisse-modal';

interface DashboardHeaderProps {
  selectedYear: string;
  years: string[];
  onYearChange: (year: string) => void;
}

/**
 * Le bandeau du bilan annuel : ce qu'on lit, et l'annee qu'on lit.
 *
 * <h3>Ce qui change</h3>
 * <p>Le choix de l'annee venait de la SECONDE bibliotheque de composants, avec son
 * intitule cache dans le `placeholder` : le champ ferme n'affichait que « 2026 », sans
 * dire de quoi il s'agissait. L'intitule est devant le champ, et la liste se cherche.</p>
 *
 * <p>Le titre etait peint en rouge de marque. Un titre n'appelle aucun geste : il reprend
 * la couleur du texte, et le rouge reste au bouton qui, lui, en appelle un.</p>
 */
export function DashboardHeader({ selectedYear, years, onYearChange }: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-foreground">Bilan Annuel {selectedYear}</h1>
        <p className="text-sm text-muted">
          Vue chronologique de la santé financière et opérationnelle
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <ChampListe
            label="Année"
            messageListeVide="Aucune année disponible"
            onChange={onYearChange}
            options={years.map((year) => ({ label: year, value: year }))}
            placeholder="Année"
            valeur={selectedYear}
          />
        </div>
        <CreerEntreeCaisseModal />
      </div>
    </div>
  );
}
