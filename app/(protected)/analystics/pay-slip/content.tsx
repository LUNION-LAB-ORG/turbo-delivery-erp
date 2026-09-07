'use client';

import { Alert, Avatar, ToggleButton, ToggleButtonGroup } from '@heroui-v3/react';
import React from 'react';

import { ListeDesLivraisons } from '@/components/dashboard/releve-de-paie/liste-des-livraisons/liste-des-livraisons';
import { DatePickers } from '@/components/ui/date-piker';

/**
 * Relevé de paie — écran de MAQUETTE.
 *
 * <h3>⚠ Les dix lignes ci-dessous sont inventées</h3>
 * <p>« Krah éric — 125 000 », « N'ndri Jena — 13 500 »… : dix noms et dix montants écrits
 * en dur dans le fichier, servis en production comme s'il s'agissait de vraies paies. Rien
 * à l'écran ne le disait. Un bandeau le dit maintenant — la refonte ne peut pas rendre
 * plus crédible une donnée qui n'existe pas, et l'effacer ferait disparaître un écran que
 * l'équipe a peut-être prévu de brancher.</p>
 *
 * <p>La route n'est liée depuis aucun menu (l'onglet correspondant est en commentaire dans
 * `analystics/layout.tsx`), mais elle reste servie et atteignable par son URL.</p>
 *
 * <h3>Ce qui change aussi</h3>
 * <p>La pastille d'initiale de chaque nom était peinte par `colorMap`, une table de
 * couleurs indexée sur la première lettre, avec `text-white` par-dessus. « Les tops 10 »
 * était une étiquette `bg-slate-700 text-white` posée en absolu par-dessus la rangée,
 * avec un `z-1000` qui n'est pas une classe Tailwind valide — elle ne produisait donc
 * aucun empilement, et recouvrait le dernier onglet.</p>
 */
const LIGNES_MAQUETTE = [
  { id: '1', montant: '125000', nomComplet: 'Krah Éric' },
  { id: '2', montant: '13500', nomComplet: "N'ndri Jena" },
  { id: '3', montant: '690000', nomComplet: 'Nguessan Drissa' },
  { id: '4', montant: '1680000', nomComplet: 'Siriki Yao' },
  { id: '5', montant: '1580000', nomComplet: 'Brou Kouamé' },
];

export default function Content() {
  const [selection, setSelection] = React.useState('1');

  return (
    <div className="flex flex-col gap-4">
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Écran de maquette</Alert.Title>
          <Alert.Description>
            Les noms et les montants de la rangée ci-dessous sont des exemples écrits en
            dur, pas des paies réelles. Ne pas s&apos;en servir pour décider d&apos;un
            versement.
          </Alert.Description>
        </Alert.Content>
      </Alert>

      <DatePickers />

      <div className="flex flex-wrap items-center gap-3">
        <ToggleButtonGroup
          aria-label="Exemples de relevés"
          className="flex-wrap"
          onSelectionChange={(sel) => setSelection(String(Array.from(sel)[0] ?? '1'))}
          selectedKeys={new Set([selection])}
          selectionMode="single"
        >
          {LIGNES_MAQUETTE.map((item) => (
            <ToggleButton id={item.id} key={item.id}>
              <Avatar className="size-6 shrink-0">
                <Avatar.Fallback>{item.nomComplet.charAt(0).toUpperCase()}</Avatar.Fallback>
              </Avatar>
              <span className="font-medium">{item.nomComplet}</span>
              <span className="font-bold tabular-nums">{item.montant}</span>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <ListeDesLivraisons />
    </div>
  );
}
