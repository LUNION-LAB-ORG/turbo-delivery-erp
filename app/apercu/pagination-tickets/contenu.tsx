'use client';

import { Button } from '@heroui-v3/react';
import React from 'react';

/**
 * Banc de pagination : pourquoi cliquer « page 2 » figeait l'onglet.
 *
 * <h3>Le mécanisme</h3>
 * <p>Les bornes de période des tickets viennent de `parseAsIsoDate` (nuqs), qui relit
 * l'URL et rend une NOUVELLE instance de `Date` à chaque rendu. Déposée telle quelle
 * dans les dépendances d'un effet, elle se compare par référence : l'effet repart à
 * chaque rendu. Comme cet effet appelait `setPageAffichee(0)`, la page demandée était
 * annulée aussitôt, ce qui provoquait un rendu, qui relançait l'effet, sans fin.</p>
 *
 * <h3>Le second défaut</h3>
 * <p>La requête est infinie : elle n'avance que d'une page à la fois. L'appel à
 * `fetchNextPage()` vivait dans le gestionnaire de clic et ne partait donc qu'UNE fois.
 * Viser la page 5 laissait un tableau vide pour toujours.</p>
 *
 * <p>Les deux colonnes ci-dessous exécutent le même scénario, l'ancienne version à
 * gauche et la nouvelle à droite. Le compteur de rendus est la mesure.</p>
 */

const TAILLE_PAGE = 20;
const NB_PAGES = 8;
const PLAFOND_RENDUS = 300;

/** Imite nuqs : une instance de `Date` neuve à chaque rendu, valeur identique. */
function useFiltresInstables() {
  return {
    debut: new Date(1767225600000),
    fin: new Date(1769817600000),
    restaurantId: '',
  };
}

/** Imite `useInfiniteQuery` : les pages arrivent une par une, jamais d'un bloc. */
function useRequeteInfinieSimulee() {
  const [pages, setPages] = React.useState<string[][]>([]);
  const [enVol, setEnVol] = React.useState(false);
  const enVolRef = React.useRef(false);

  React.useEffect(() => {
    const t = setTimeout(() => setPages([premierePage()]), 120);
    return () => clearTimeout(t);
  }, []);

  const fetchNextPage = React.useCallback(() => {
    if (enVolRef.current) return;
    enVolRef.current = true;
    setEnVol(true);
    setTimeout(() => {
      setPages((p) => (p.length >= NB_PAGES ? p : [...p, pageNumero(p.length)]));
      enVolRef.current = false;
      setEnVol(false);
    }, 120);
  }, []);

  return { fetchNextPage, hasNextPage: pages.length < NB_PAGES, isFetchingNextPage: enVol, pages };
}

function premierePage() {
  return pageNumero(0);
}

function pageNumero(index: number) {
  return Array.from({ length: TAILLE_PAGE }, (_, i) => `T${168700000 + index * TAILLE_PAGE + i}`);
}

/** L'ancienne version : dépendance sur l'objet `Date`, chargement dans le clic. */
function VersionAvant() {
  const filtres = useFiltresInstables();
  const requete = useRequeteInfinieSimulee();
  const [pageAffichee, setPageAffichee] = React.useState(0);
  const rendus = React.useRef(0);
  rendus.current += 1;
  const emballe = rendus.current > PLAFOND_RENDUS;

  React.useEffect(() => {
    if (rendus.current > PLAFOND_RENDUS) return;
    setPageAffichee(0);
  }, [filtres.restaurantId, filtres.debut, filtres.fin]);

  const allerA = (p: number) => {
    if (p - 1 >= requete.pages.length && requete.hasNextPage) requete.fetchNextPage();
    setPageAffichee(p - 1);
  };

  return (
    <Colonne
      emballe={emballe}
      lignes={requete.pages[pageAffichee] ?? []}
      onAller={allerA}
      page={pageAffichee + 1}
      rendus={rendus.current}
      titre="Avant"
    />
  );
}

/** La nouvelle : comparaison par valeur, chargement séquentiel dans un effet. */
function VersionApres() {
  const filtres = useFiltresInstables();
  const requete = useRequeteInfinieSimulee();
  const [pageAffichee, setPageAffichee] = React.useState(0);
  const rendus = React.useRef(0);
  rendus.current += 1;

  const debutMs = filtres.debut.getTime();
  const finMs = filtres.fin.getTime();

  React.useEffect(() => {
    setPageAffichee(0);
  }, [filtres.restaurantId, debutMs, finMs]);

  const { fetchNextPage, hasNextPage, isFetchingNextPage, pages } = requete;
  const nbPages = pages.length;

  React.useEffect(() => {
    if (pageAffichee < nbPages) return;
    if (hasNextPage) {
      if (!isFetchingNextPage) fetchNextPage();
      return;
    }
    if (nbPages > 0) setPageAffichee(nbPages - 1);
  }, [pageAffichee, nbPages, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Colonne
      emballe={false}
      lignes={pages[pageAffichee] ?? []}
      onAller={(p) => setPageAffichee(p - 1)}
      page={pageAffichee + 1}
      rendus={rendus.current}
      titre="Après"
    />
  );
}

function Colonne({
  emballe,
  lignes,
  onAller,
  page,
  rendus,
  titre,
}: {
  emballe: boolean;
  lignes: string[];
  onAller: (p: number) => void;
  page: number;
  rendus: number;
  titre: string;
}) {
  return (
    <div className="flex-1 rounded-lg border border-default-200 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">{titre}</h2>
        <span className="text-xs tabular-nums text-muted">{rendus} rendus</span>
      </div>
      <div className="mb-3 flex gap-2">
        <Button onPress={() => onAller(2)} size="sm" variant="ghost">
          Page 2
        </Button>
        <Button onPress={() => onAller(5)} size="sm" variant="ghost">
          Page 5
        </Button>
      </div>
      {emballe ? (
        <p className="rounded bg-danger-50 p-3 text-xs text-danger-600">
          Emballement : l&apos;effet est reparti plus de {PLAFOND_RENDUS} fois. Le banc s&apos;est
          arrêté ; dans l&apos;écran réel, rien ne l&apos;arrêtait et l&apos;onglet se figeait.
        </p>
      ) : null}
      <p className="mb-2 text-xs text-muted">
        Page affichée <span className="tabular-nums">{page}</span> — {lignes.length} lignes
      </p>
      <ul className="max-h-64 overflow-auto text-xs tabular-nums">
        {lignes.map((l) => (
          <li className="border-b border-default-100 py-1" key={l}>
            {l}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ApercuPaginationTickets() {
  return (
    <div className="p-6">
      <h1 className="mb-1 text-lg font-semibold">Banc de pagination des tickets</h1>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Même scénario des deux côtés. Cliquez « Page 2 » puis « Page 5 ». À gauche, la page
        demandée est annulée à chaque rendu et le compteur s&apos;emballe. À droite, elle tient, et
        les pages manquantes se chargent l&apos;une après l&apos;autre jusqu&apos;à la cible.
      </p>
      <div className="flex gap-4">
        <VersionAvant />
        <VersionApres />
      </div>
    </div>
  );
}
