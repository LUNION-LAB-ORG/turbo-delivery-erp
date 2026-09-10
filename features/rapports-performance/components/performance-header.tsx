'use client';

import { AlertTriangle, Download, ListOrdered } from 'lucide-react';
import { Button } from '@heroui-v3/react';
import React from 'react';
import { DateRange } from 'react-day-picker';

import DateFilterInput from '@/components/finance/date-filter-input';
import { LienAvecFiltres } from '@/components/commons/LienAvecFiltres';

interface PerformanceHeaderProps {
  /** Ce sur quoi le rapport porte : « PLATO », « 4 partenaires », « Groupe AGHA ». */
  libelleSelection: string;
  /**
   * Ce qui empeche de lire quelque chose : groupe inconnu, groupe vide. Nul dans le cas
   * courant.
   */
  avertissement?: string | null;
  /**
   * Le selecteur, INJECTE par l'appelant.
   *
   * <p>L'en-tete fait la mise en page, pas le branchement : c'est ce qui permet a l'ecran
   * reel de lui donner un selecteur relie aux requetes, et au banc de lui donner le meme
   * composant relie a des donnees d'exemple. Un en-tete qui lirait lui-meme la liste des
   * partenaires ne serait pas montrable hors session.</p>
   */
  selecteur: React.ReactNode;
  debut: Date | undefined;
  fin: Date | undefined;
  onDateChange: (value: DateRange | undefined) => void;
  onExportPdf: () => void;
}

/**
 * Le bandeau du rapport de performance : ce qu'on lit, sur quoi, et sur quelle periode.
 *
 * <h3>Pourquoi deux rangs</h3>
 * <p>Le bandeau tenait sur une ligne parce qu'il ne portait qu'un champ. Avec la bascule a
 * trois modes et son controle, la ligne fait plus de 1 100 px, alors que la fenetre reelle
 * du poste en fait environ 1 000 : elle se serait repliee n'importe ou, en coupant la
 * bascule de son propre champ. Le titre et l'export occupent le premier rang, les
 * commandes de selection le second.</p>
 */
export function PerformanceHeader({
  avertissement,
  debut,
  fin,
  libelleSelection,
  onDateChange,
  onExportPdf,
  selecteur,
}: PerformanceHeaderProps) {
  return (
    <div className="mb-6 bg-surface rounded-lg shadow-sm">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Rapport de Performance</h1>
            {/*
             * Le sous-titre disait « Restaurant X », ce qui devient faux des qu'il y en a
             * plusieurs : « Restaurant 4 partenaires » ne veut rien dire. Il porte
             * desormais le libelle de la selection, tel que le SERVEUR l'a arbitre.
             */}
            <p className="text-sm text-muted mt-1">{libelleSelection}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/*
             * L'ACCES AU CLASSEMENT.
             *
             * <p>La note l'appelle « Classification des partenaires » a un endroit et
             * « PERFORMANCE GENERALE » a un autre. C'est le premier libelle qui est
             * retenu, pour trois raisons. « Performance generale » nomme un THEME et non
             * une destination : pose sur cet ecran-ci, qui s'intitule deja « Rapport de
             * Performance », il ne distinguerait rien de ce qu'on regarde. La seconde
             * mention decrit d'ailleurs le POINT DE DEPART du clic (« depuis la page
             * d'accueil du module »), c'est-a-dire cette page, pas l'etiquette du bouton.
             * Enfin « Classification des partenaires » est le seul des deux qui dise ce
             * qu'on va trouver, et c'est le mot du commanditaire.</p>
             *
             * <p>C'est un LIEN, pas un bouton : la periode et le perimetre sont deja dans
             * l'URL, il suffit de recopier la chaine de requete pour que le classement
             * arrive filtre comme le rapport. Un lien s'ouvre en plus dans un nouvel
             * onglet, ce qui permet de garder le rapport sous les yeux.</p>
             */}
            <LienAvecFiltres chemin="/finance/rapports-performance/classement" variante="outline">
              <ListOrdered aria-hidden="true" className="size-4" />
              Classification des partenaires
            </LienAvecFiltres>

            {/*
             * Le bouton portait `color="primary"` ET `bg-orange-500` : deux couleurs
             * contradictoires posees sur le meme element, dont l'orange gagnait — une
             * teinte qui n'appartient a aucun theme du projet.
             */}
            <Button onPress={onExportPdf} variant="primary">
              <Download aria-hidden="true" className="size-4" />
              Exporter PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-3">
          {/*
           * SUPPRIME de longue date : un `div` de 16 rem, en `bg-red-50 text-red-600`,
           * ENTIEREMENT VIDE, pousse contre le selecteur de restaurant. Un fond `red-50`
           * ne dit rien parce qu'il ne recouvre rien.
           */}
          {selecteur}

          <div className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-1.5">
            <DateFilterInput
              filters={{ debut, fin }}
              handleDateChange={onDateChange}
              variant="outline"
            />
          </div>
        </div>

        {/*
         * L'avertissement DIT pourquoi l'ecran est a zero. Sans lui, un groupe dissous et
         * un groupe sans etablissement produisent le meme ecran vide qu'un partenaire sans
         * activite, et rien ne distingue la panne de lien du fait metier.
         *
         * La teinte d'alerte est ici l'un des rares endroits ou peindre du TEXTE dit
         * quelque chose : « ce que tu lis ne porte sur aucun etablissement ».
         */}
        {avertissement && (
          <p className="flex items-start gap-2 text-sm text-warning-soft-foreground" role="status">
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {avertissement}
          </p>
        )}
      </div>
    </div>
  );
}
