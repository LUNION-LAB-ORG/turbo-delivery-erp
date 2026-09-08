'use client';

import { Alert, Card, Label, SearchField } from '@heroui-v3/react';
import { MoveLeft } from 'lucide-react';
import React from 'react';

import { CardHeader } from '@/components/commons/card-header';
import { LienBouton } from '@/components/commons/LienBouton';
import { PageWrapper } from '@/components/commons/page-wrapper';
import {
  TableauResponsive,
  type ColonneResponsive,
} from '@/components/commons/TableauResponsive';

/**
 * Le detail d'un releve de paie : les livraisons qui le composent.
 *
 * <h3>Ce qui change</h3>
 * <p>L'ecran montait le `DataTable` de la SECONDE bibliotheque de composants, dont le
 * filtre global est cable sur une fonction qui rend `false` sans condition
 * (`components/ui/data-table.tsx`, `fuzzyFilter`). Taper une lettre dans « Rechercher »
 * VIDAIT donc le tableau, quel que soit le texte. La recherche filtre desormais sur
 * toutes les colonnes visibles, et elle rend ce qu'elle trouve.</p>
 *
 * <p>La colonne « Authentif » peignait un interrupteur rouge pale IDENTIQUE sur chaque
 * ligne, sans jamais lire `row.authentif` : l'ecran affirmait la meme chose de toutes les
 * livraisons, y compris de celles qui ne portent pas l'information. La valeur reelle est
 * ecrite, et son absence se lit comme une absence.</p>
 *
 * <p>Les huit pictogrammes d'en-tete etaient decoratifs et arbitraires (une cerise pour un
 * cout de livraison), l'un d'eux peint en pastille rouge et un chevron rouge devant chaque
 * restaurant. Le rouge de marque appelle un geste ; il ne decore pas une categorie.</p>
 *
 * <p>Les deux couts sont des montants : chasse tabulaire et alignement a droite, seule
 * facon de comparer deux ordres de grandeur d'un coup d'oeil.</p>
 */

export interface LigneLivraisonReleve {
  authentif?: boolean | string;
  coutCommande?: string;
  coutLivraison?: string;
  dateHeure?: string;
  id: string;
  livreur?: string;
  reference?: string;
  restaurant?: string;
}

interface Props {
  data: LigneLivraisonReleve[];
}

/** Une valeur absente se lit comme absente, jamais comme un « non ». */
function texte(valeur?: string) {
  return valeur && valeur.trim() !== '' ? valeur : '—';
}

/**
 * L'authentification, telle qu'elle arrive.
 *
 * <p>Le champ vaut « Oui » sur certaines lignes et manque sur d'autres : on ne peut pas
 * en deduire un « Non », qui serait une affirmation que la donnee ne porte pas.</p>
 */
function libelleAuthentification(valeur?: boolean | string) {
  if (typeof valeur === 'boolean') return valeur ? 'Oui' : 'Non';
  return texte(valeur);
}

export function DetailContent({ data }: Props) {
  const [recherche, setRecherche] = React.useState('');

  const colonnes: readonly ColonneResponsive<LigneLivraisonReleve>[] = [
    {
      cle: 'reference',
      identite: true,
      libelle: 'Référence',
      rendu: (l) => <span className="font-medium text-foreground">{texte(l.reference)}</span>,
    },
    { cle: 'id', libelle: 'ID', rendu: (l) => <span className="tabular-nums">#{l.id}</span> },
    { cle: 'dateHeure', libelle: 'Date et heure', rendu: (l) => texte(l.dateHeure) },
    { cle: 'livreur', libelle: 'Livreur', rendu: (l) => texte(l.livreur) },
    { cle: 'restaurant', libelle: 'Restaurant', rendu: (l) => texte(l.restaurant) },
    {
      cle: 'coutLivraison',
      libelle: 'Coût de livraison',
      nombre: true,
      rendu: (l) => texte(l.coutLivraison),
    },
    {
      cle: 'coutCommande',
      libelle: 'Coût commande',
      nombre: true,
      rendu: (l) => texte(l.coutCommande),
    },
    {
      cle: 'authentif',
      libelle: 'Authentif',
      rendu: (l) => libelleAuthentification(l.authentif),
    },
  ];

  const terme = recherche.trim().toLowerCase();
  const lignes = terme
    ? data.filter((l) =>
        colonnes.some((c) => {
          const brut = l[c.cle as keyof LigneLivraisonReleve];
          return brut != null && String(brut).toLowerCase().includes(terme);
        }),
      )
    : data;

  return (
    <PageWrapper>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <CardHeader title="Détail de Krah Éric - 01/02/2025" />
        {/*
         * C'etait un `<Link>` glisse a cote d'une fleche, dans un div `cursor-pointer
         * text-red-500` : seul le texte etait cliquable, et la fleche mimait un bouton
         * sans en etre un. Le lien porte maintenant la surface entiere.
         */}
        <LienBouton href="/analystics/pay-slip" taille="sm" variante="ghost">
          <MoveLeft aria-hidden="true" className="size-4" />
          Retour à la liste
        </LienBouton>
      </div>

      {/*
       * Les lignes servies ici sont ecrites en dur dans `page.tsx`, comme celles de
       * l'ecran parent qui porte deja le meme avertissement. Le dire est la seule chose
       * honnete a faire tant que la route n'est pas branchee.
       */}
      <Alert className="mb-4" status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Écran de maquette</Alert.Title>
          <Alert.Description>
            Les livraisons ci-dessous sont des exemples écrits en dur, pas le relevé d&apos;un
            coursier. Ne pas s&apos;en servir pour décider d&apos;un versement.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <Card>
        <Card.Header>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Card.Title>Livraisons du relevé</Card.Title>
              <p className="text-sm text-muted tabular-nums">
                {lignes.length} sur {data.length}
              </p>
            </div>
            <SearchField
              className="min-w-[220px]"
              onChange={setRecherche}
              value={recherche}
            >
              <Label>Rechercher</Label>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Référence, restaurant, livreur…" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          </div>
        </Card.Header>
        <Card.Content>
          <TableauResponsive
            cleLigne={(l) => l.id}
            colonnes={colonnes}
            libelle="Livraisons du relevé de paie"
            lignes={lignes}
            vide={
              terme
                ? 'Aucune livraison ne correspond à cette recherche'
                : 'Aucune livraison sur ce relevé'
            }
          />
        </Card.Content>
      </Card>
    </PageWrapper>
  );
}
