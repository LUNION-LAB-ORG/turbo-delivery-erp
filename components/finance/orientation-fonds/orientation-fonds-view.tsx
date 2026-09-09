'use client';

import { Button, Checkbox } from '@heroui-v3/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { RestaurantSelect } from '@/components/finance/recouvrements/common/restaurant-select';
import {
  type OrientationFonds,
  useOrienterFondsMutation,
  useReorienterFondsMutation,
} from '@/features/orientation-fonds';
import {
  type ActionGroupee,
  type IActionsGroupeesFiltres,
  useActionsGroupeesMutation,
  useFacturesRFQuery,
} from '@/features/responsable-financier';
import { formatNombre } from '@/utils/format.utils';

import { FenetreOrientation, FenetreReorientation } from './fenetre-orientation';
import {
  FILE_TOUTES,
  FILES_ORIENTATION,
  type LigneOrientation,
  sommeMontants,
} from './ligne-orientation';
import {
  BarreLotOrientation,
  type OngletOrientation,
  OngletsOrientation,
  TableauOrientation,
} from './table-orientation';

/**
 * Orientation des fonds : la file de decision de la Direction.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Pas un nom de partenaire : la somme qui attend une decision. L'ecran n'affichait
 * AUCUN total, seulement des cartes. On savait qu'il y avait « 454 en attente » sans
 * jamais savoir ce que cela pesait.</p>
 *
 * <h3>Ou sont passees les trois cartes de chiffres</h3>
 * <p>Dans les ONGLETS, qui sont exactement les trois ensembles qu'elles comptaient. Un
 * bandeau de cartes au-dessus d'onglets qui portent deja le meme compte et le meme montant
 * ne fait que rallonger la page, ce que ces onglets sont justement la pour eviter. Rien
 * n'est perdu : « En attente d'orientation » est l'onglet « Les deux files », « Dont deja
 * visees DGA » est l'onglet « Vise DGA (stock) », « Conserves en caisse » est le quatrieme
 * onglet, et les montants y sont donnes en entier, jamais arrondis. La phrase des cartes
 * (« les autres seront visees par la decision ») est dite en tete d'ecran, une fois.</p>
 *
 * <h3>Pourquoi des onglets, et non un menu deroulant</h3>
 * <p>Le menu « File » cachait ses deux valeurs et ce qu'elles pesaient ; les fonds
 * conserves en caisse, eux, etaient un SECOND tableau de vingt lignes empile sous le
 * premier, qu'on n'atteignait qu'au defilement. Ce sont trois ensembles, et la caisse a
 * meme un autre geste (re-orienter). Un onglet dit son compte et son montant sans qu'on
 * l'ouvre ; un menu deroulant ne dit rien tant qu'on ne l'a pas deplie.</p>
 *
 * <p>Le filtre PARTENAIRE, lui, reste un filtre : il traverse les quatre onglets, donc il
 * est pose au-dessus d'eux.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Decider. Le geste porte donc l'accent : sur la ligne, sur le lot, et dans la fenetre
 * de confirmation. Les titres, les montants et les numeros de visa informent et restent en
 * jetons neutres.</p>
 *
 * <h3>La troncature</h3>
 * <p>Les trois listes etaient lues avec `size: 100` ecrit en dur et sans pagination :
 * l'ecran montrait au plus 200 operations sur 454, et les 254 autres n'etaient
 * ATTEIGNABLES PAR AUCUN CHEMIN. La mention « 153 affichees » disait vrai, mais elle
 * n'ouvrait rien. La file se pagine.</p>
 *
 * <p>Deux statuts alimentent une seule file : « En attente visa DGA » (le visa sera pose
 * par la decision) et « Vise DGA » (le stock deja vise). Le serveur les pagine
 * separement, donc la page k de la file est la page k du premier statut suivie de la page
 * k du second : chaque operation tombe sur une page et une seule, et toutes sont
 * atteignables. Le compte affiche dit combien de lignes sont rendues sur le total.</p>
 */

/** Une page de file, par statut. Le serveur retombe sur 20 quand rien n'est demande. */
const TAILLE = 20;

/**
 * Le quatrieme onglet. Ce n'est pas une file de decision : le statut est deja pose, et le
 * geste qu'on y fait est l'inverse (re-orienter vers la banque). D'ou une cle a part, qui
 * n'entre jamais dans les filtres d'un geste en lot.
 */
const ONGLET_CAISSE = 'Conservé en caisse';

export default function OrientationFondsView() {
  const queryClient = useQueryClient();
  const [onglet, setOnglet] = useState<string>(FILE_TOUTES);
  const [partenaire, setPartenaire] = useState('');
  const [page, setPage] = useState(0);
  const [pageCaisse, setPageCaisse] = useState(0);

  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [toutLaFile, setToutLaFile] = useState(false);

  const [cible, setCible] = useState<null | { lignes: LigneOrientation[]; tout: boolean }>(null);
  const [reorient, setReorient] = useState<LigneOrientation | null>(null);

  // 2026-07-27 (choix metier) : le visa DGA n'est plus une etape manuelle, decider de
  // l'orientation VAUT visa. La file agrege donc « En attente visa DGA » (visa pose
  // implicitement par le backend) et le stock historique « Vise DGA ».
  //
  // Les TROIS lectures partent quel que soit l'onglet ouvert : chaque onglet annonce son
  // compte et son montant, y compris ceux qu'on ne regarde pas.
  const restaurantId = partenaire || undefined;
  const qAttente = useFacturesRFQuery({
    page,
    periode: 'cycle',
    restaurantId,
    size: TAILLE,
    statut: 'En attente visa DGA',
  });
  const qVise = useFacturesRFQuery({
    page,
    periode: 'cycle',
    restaurantId,
    size: TAILLE,
    statut: 'Visé DGA',
  });
  const qCaisse = useFacturesRFQuery({
    page: pageCaisse,
    periode: 'cycle',
    restaurantId,
    size: TAILLE,
    statut: 'Conservé en caisse',
  });

  const orienter = useOrienterFondsMutation();
  const reorienter = useReorienterFondsMutation();
  const enLot = useActionsGroupeesMutation();

  const surCaisse = onglet === ONGLET_CAISSE;
  /** La file lue par le panneau ouvert. L'onglet caisse n'en designe aucune. */
  const file = surCaisse ? FILE_TOUTES : onglet;
  const montreAttente = !surCaisse && (file === FILE_TOUTES || file === 'En attente visa DGA');
  const montreVise = !surCaisse && (file === FILE_TOUTES || file === 'Visé DGA');

  const lignes: LigneOrientation[] = [
    ...(montreAttente ? (qAttente.data?.factures?.content ?? []) : []),
    ...(montreVise ? (qVise.data?.factures?.content ?? []) : []),
  ];
  const conservees = qCaisse.data?.factures?.content ?? [];

  // Les compteurs affichaient la taille de la PAGE demandee. `totalElements` est le total
  // serveur, et `stats.totalMontant` est calcule sur l'ensemble filtre avant pagination :
  // les deux decrivent la file entiere, pas ce qui est a l'ecran.
  const nbAttente = qAttente.data?.factures?.totalElements ?? 0;
  const nbVise = qVise.data?.factures?.totalElements ?? 0;
  const montantAttente = qAttente.data?.stats?.totalMontant ?? 0;
  const montantVise = qVise.data?.stats?.totalMontant ?? 0;

  const totalFile = (montreAttente ? nbAttente : 0) + (montreVise ? nbVise : 0);
  const montantFile = (montreAttente ? montantAttente : 0) + (montreVise ? montantVise : 0);
  const pagesFile = Math.max(
    montreAttente ? (qAttente.data?.factures?.totalPages ?? 0) : 0,
    montreVise ? (qVise.data?.factures?.totalPages ?? 0) : 0,
  );

  const nbCaisse = qCaisse.data?.factures?.totalElements ?? 0;
  const montantCaisse = qCaisse.data?.stats?.totalMontant ?? 0;
  const pagesCaisse = qCaisse.data?.factures?.totalPages ?? 0;

  // Deux lectures agregees derriere un seul indicateur : si l'une echoue, la file « a
  // orienter » se vidait SILENCIEUSEMENT et le decideur croyait avoir tout traite.
  const chargementFile = (montreAttente && qAttente.isLoading) || (montreVise && qVise.isLoading);
  const erreurFile = (montreAttente && qAttente.isError) || (montreVise && qVise.isError);
  const relanceFile = () => {
    if (montreAttente) qAttente.refetch();
    if (montreVise) qVise.refetch();
  };

  const viderSelection = () => {
    setSelection(new Set());
    setToutLaFile(false);
  };

  // La selection ne survit ni a l'onglet, ni au filtre, ni a la page : elle nomme des
  // lignes qui ne sont plus a l'ecran, et un geste en lot porterait alors sur autre chose
  // que ce qui est vu.
  useEffect(() => {
    viderSelection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet, partenaire, page]);

  // Un lot traite peut vider la derniere page : sans ce recalage, l'ecran resterait sur
  // une page desormais hors bornes et afficherait « aucune operation » alors qu'il en
  // reste des centaines en amont.
  useEffect(() => {
    if (pagesFile > 0 && page >= pagesFile) setPage(pagesFile - 1);
  }, [page, pagesFile]);

  useEffect(() => {
    if (pagesCaisse > 0 && pageCaisse >= pagesCaisse) setPageCaisse(pagesCaisse - 1);
  }, [pageCaisse, pagesCaisse]);

  const basculerLigne = (id: string) => {
    setToutLaFile(false);
    setSelection((prev) => {
      const suivant = new Set(prev);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  };

  const idsPage = lignes.map((l) => l.id);
  const pageCochee = idsPage.length > 0 && idsPage.every((id) => selection.has(id));
  const pagePartielle = idsPage.some((id) => selection.has(id)) && !pageCochee;

  const basculerPage = () => {
    setToutLaFile(false);
    setSelection((prev) => {
      const suivant = new Set(prev);
      if (pageCochee) idsPage.forEach((id) => suivant.delete(id));
      else idsPage.forEach((id) => suivant.add(id));
      return suivant;
    });
  };

  const lignesCochees = lignes.filter((l) => selection.has(l.id));
  const nbLot = toutLaFile ? totalFile : lignesCochees.length;
  const montantLot = toutLaFile ? montantFile : sommeMontants(lignesCochees);

  // Le geste « toute la file » passe par les filtres cote serveur : il ne sait viser
  // qu'UN statut a la fois, donc il n'est offert que sur une file choisie.
  const fileUnique = !surCaisse && file !== FILE_TOUTES;

  const filtresLot: IActionsGroupeesFiltres = {
    periode: 'cycle',
    restaurantId,
    statut: file,
  };

  const confirmerOrientation = (orientation: OrientationFonds, motif?: string) => {
    if (!cible) return;
    const action: ActionGroupee =
      orientation === 'DEPOT_BANQUE' ? 'ORIENTER_BANQUE' : 'ORIENTER_CAISSE';
    const finir = () => {
      // Le geste EN LOT passe par la mutation du responsable financier, qui n'invalide que
      // SES listes. Le geste a l'unite, lui, invalide aussi « orientation-fonds » et
      // « caissier ». Sans ces deux lignes, « Verification des depots » (staleTime 60 s) et
      // le suivi caissier continuaient de servir des fonds deja orientes en lot. Le correctif
      // est pose ICI, sur l'appelant, plutot que dans une mutation partagee par d'autres
      // ecrans.
      queryClient.invalidateQueries({ queryKey: ['orientation-fonds'] });
      queryClient.invalidateQueries({ queryKey: ['caissier'] });
      setCible(null);
      viderSelection();
    };

    if (cible.tout) {
      enLot.mutate({ action, filtres: filtresLot, motif, selectAll: true }, { onSuccess: finir });
      return;
    }
    // Une seule operation garde son endpoint dedie : il rend le statut obtenu, donc un
    // message qui nomme la destination reelle des fonds.
    if (cible.lignes.length === 1) {
      orienter.mutate(
        { data: { motif, orientation }, id: cible.lignes[0].id },
        { onSuccess: finir },
      );
      return;
    }
    enLot.mutate(
      { action, ids: cible.lignes.map((l) => l.id), motif, selectAll: false },
      { onSuccess: finir },
    );
  };

  const enAttenteOrientation = orienter.isPending || enLot.isPending;

  /* Le panneau des files. Les trois premiers onglets rendent le MEME panneau : ce qui
     change entre eux, c'est la partition lue plus haut, pas la forme de la liste. */
  const panneauFile = (
    <div className="flex flex-col gap-3">
      {/* Le titre nomme le TRAVAIL, pas la partition. L'onglet ouvert peut s'appeler « Les
          deux files », qui est un vocabulaire de filtre et ne dit pas ce qu'on vient faire
          ici ; sous lui, la premiere ligne visible n'etait qu'un decompte. La phrase
          survivait dans le nom accessible du tableau et dans l'etat vide, donc un lecteur
          d'ecran ne perdait rien, mais l'oeil, si. */}
      <div>
        <h2 className="text-sm font-semibold text-foreground">En attente d&apos;orientation</h2>
        <p className="mt-0.5 text-sm text-muted">
          <span className="tabular-nums">{formatNombre(lignes.length)}</span> affichées sur{' '}
          <span className="tabular-nums">{formatNombre(totalFile)}</span>
          {pagesFile > 1 && ` · page ${page + 1} sur ${pagesFile}`}
        </p>
      </div>

      {!chargementFile && !erreurFile && lignes.length > 0 && (
        <div className="hidden flex-wrap items-center gap-3 px-1 text-sm md:flex">
          <Checkbox
            isIndeterminate={pagePartielle && !toutLaFile}
            isSelected={pageCochee || toutLaFile}
            onChange={basculerPage}
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              {/* `Checkbox` n'expose que Root/Content/Control/Indicator : le libelle est
                  un enfant ordinaire du Content, deja zone cliquable. */}
              <span className="text-sm text-muted">Sélectionner la page</span>
            </Checkbox.Content>
          </Checkbox>

          {pageCochee && !toutLaFile && fileUnique && totalFile > lignes.length && (
            <Button onPress={() => setToutLaFile(true)} size="sm" variant="ghost">
              Sélectionner les {formatNombre(totalFile)} opérations de cette file
            </Button>
          )}
          {pageCochee && !toutLaFile && !fileUnique && totalFile > lignes.length && (
            <span className="text-xs text-muted">
              Choisissez une file pour sélectionner ses opérations d&apos;un seul coup.
            </span>
          )}
          {toutLaFile && (
            <span className="flex items-center gap-1 text-muted">
              Les <b className="tabular-nums">{formatNombre(totalFile)}</b> opérations de la file
              sont sélectionnées
              <Button onPress={viderSelection} size="sm" variant="ghost">
                Effacer
              </Button>
            </span>
          )}
        </div>
      )}

      {erreurFile ? (
        <EtatErreur
          enCours={qAttente.isFetching || qVise.isFetching}
          onReessayer={relanceFile}
          quoi="les opérations à orienter"
        />
      ) : (
        <TableauOrientation
          enChargement={chargementFile}
          estSelectionnee={(id) => toutLaFile || selection.has(id)}
          libelle="Opérations en attente d'orientation"
          libelleAction="Orienter"
          lignes={lignes}
          onAction={(l) => setCible({ lignes: [l], tout: false })}
          onBasculer={basculerLigne}
          onPage={(p) => setPage(p - 1)}
          page={page + 1}
          totalPages={pagesFile}
          vide="Aucune opération en attente d'orientation."
        />
      )}
    </div>
  );

  /* Les fonds retenus, re-orientables un par un. « Fonds de roulement » etait repete sur
     chaque carte : c'est la definition de l'ensemble, pas une propriete de chaque ligne. */
  const panneauCaisse = (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Fonds de roulement gardés en caisse, ré-orientables un par un.{' '}
        <span className="tabular-nums">{formatNombre(conservees.length)}</span> affichés sur{' '}
        <span className="tabular-nums">{formatNombre(nbCaisse)}</span>
        {pagesCaisse > 1 && ` · page ${pageCaisse + 1} sur ${pagesCaisse}`}
      </p>

      {qCaisse.isError ? (
        <EtatErreur
          enCours={qCaisse.isFetching}
          onReessayer={() => qCaisse.refetch()}
          quoi="les fonds conservés en caisse"
        />
      ) : (
        <TableauOrientation
          enChargement={qCaisse.isLoading}
          libelle="Fonds conservés en caisse"
          libelleAction="Ré-orienter vers la banque"
          lignes={conservees}
          onAction={(l) => setReorient(l)}
          onPage={(p) => setPageCaisse(p - 1)}
          page={pageCaisse + 1}
          totalPages={pagesCaisse}
          vide="Aucun fonds conservé en caisse."
        />
      )}
    </div>
  );

  /* Ce que chaque onglet annonce. Les trois files reprennent le VOCABULAIRE du menu
     deroulant qu'elles remplacent (`FILES_ORIENTATION`), au mot pres : l'operateur
     retrouve les libelles qu'il connait.

     La cle est TYPEE sur `FILES_ORIENTATION`, et non sur `string` : les onglets etalent
     `resumeFile[f.value]`, si bien qu'une file ajoutee la-bas sans son resume ici
     compilerait sans erreur, `nombre` vaudrait `undefined`, et l'onglet n'annoncerait
     silencieusement rien. Avec ce type, l'oubli ne compile pas. */
  const resumeFile: Record<
    (typeof FILES_ORIENTATION)[number]['value'],
    { enChargement: boolean; enErreur: boolean; montant: number; nombre: number }
  > = {
    'En attente visa DGA': {
      enChargement: qAttente.isLoading,
      enErreur: qAttente.isError,
      montant: montantAttente,
      nombre: nbAttente,
    },
    [FILE_TOUTES]: {
      enChargement: qAttente.isLoading || qVise.isLoading,
      enErreur: qAttente.isError || qVise.isError,
      montant: montantAttente + montantVise,
      nombre: nbAttente + nbVise,
    },
    'Visé DGA': {
      enChargement: qVise.isLoading,
      enErreur: qVise.isError,
      montant: montantVise,
      nombre: nbVise,
    },
  };

  const onglets: OngletOrientation[] = [
    ...FILES_ORIENTATION.map((f) => ({
      cle: f.value,
      ...resumeFile[f.value],
      libelle: f.label,
      panneau: panneauFile,
    })),
    {
      cle: ONGLET_CAISSE,
      enChargement: qCaisse.isLoading,
      enErreur: qCaisse.isError,
      libelle: 'Conservés en caisse',
      montant: montantCaisse,
      nombre: nbCaisse,
      panneau: panneauCaisse,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Comptabilité · Direction</p>
          {/* Un titre INFORME : il n'appelle aucun geste, donc il n'est pas coloré. */}
          <h1 className="text-2xl font-bold text-foreground">Orientation des fonds</h1>
          <p className="mt-0.5 text-sm text-muted">
            La Direction décide de la destination des fonds : dépôt en banque ou conservation en
            caisse (fonds de roulement). Décider vaut visa : depuis « En attente visa DGA », le visa
            DGA est posé automatiquement, les autres sont déjà visées.
          </p>
        </div>

        {/* Le partenaire est un FILTRE, pas un ensemble : il traverse les quatre onglets,
            donc il est pose au-dessus d'eux et non dans l'un d'eux. */}
        <div className="flex items-end gap-1">
          {/* `RestaurantSelect` est un composant PARTAGE : il n'accepte ni `label` ni
              `aria-label` et ne rend aucun `<Label>`. Le libelle etait donc un `<span>`
              nu, lie a rien, et le champ n'etait annonce par RIEN. Le `<label>` natif
              qui l'enveloppe nomme le premier champ qu'il contient, sans toucher au
              composant partage ni changer ce qui est a l'ecran. */}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Partenaire</span>
            <RestaurantSelect
              className="w-full text-xs sm:w-[220px]"
              onChange={(v) => {
                setPartenaire(v ?? '');
                setPage(0);
                setPageCaisse(0);
              }}
              placeholder="Tous les partenaires"
              value={partenaire || undefined}
            />
          </label>
          {/* Sans ce retrait, choisir un partenaire est un cul-de-sac : le
              ComboBox n'offre pas d'option « tous ». */}
          {partenaire && (
            <Button
              onPress={() => {
                setPartenaire('');
                setPage(0);
                setPageCaisse(0);
              }}
              size="sm"
              variant="ghost"
            >
              Tous
            </Button>
          )}
        </div>
      </div>

      <OngletsOrientation
        onSelection={(cle) => {
          setOnglet(cle);
          setPage(0);
        }}
        onglets={onglets}
        selection={onglet}
      />

      <BarreLotOrientation
        montant={montantLot}
        nombre={nbLot}
        onEffacer={viderSelection}
        onOrienter={() => setCible({ lignes: lignesCochees, tout: toutLaFile })}
        precision={toutLaFile ? 'Toutes les pages de la file sélectionnée' : undefined}
      />

      <FenetreOrientation
        enAttente={enAttenteOrientation}
        ligneUnique={cible && !cible.tout && cible.lignes.length === 1 ? cible.lignes[0] : undefined}
        montant={cible ? (cible.tout ? montantFile : sommeMontants(cible.lignes)) : 0}
        nombre={cible ? (cible.tout ? totalFile : cible.lignes.length) : 0}
        onConfirmer={confirmerOrientation}
        onFermer={() => setCible(null)}
        ouvert={!!cible}
      />

      <FenetreReorientation
        enAttente={reorienter.isPending}
        ligne={reorient}
        onConfirmer={(motif) => {
          if (!reorient) return;
          reorienter.mutate(
            { data: { motif }, id: reorient.id },
            { onSuccess: () => setReorient(null) },
          );
        }}
        onFermer={() => setReorient(null)}
      />
    </div>
  );
}
