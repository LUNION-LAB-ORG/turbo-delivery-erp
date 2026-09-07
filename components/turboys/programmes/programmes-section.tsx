'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { parseAsInteger, useQueryStates } from 'nuqs';
import React from 'react';
import { toast } from 'sonner';

import { CarburantRapideModal } from './carburant-rapide-modal';
import { EngagementCarburantConnecte } from './engagement-carburant';
import { ProgrammeApercuModal } from './programme-apercu-modal';
import { ProgrammeFormModal } from './programme-form-modal';
import { joursAvecDates } from './weekly-jours-editor';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { SemaineProgrammes } from '@/features/programmes/refonte/semaine-programmes';
import { useLivreursListQuery } from '@/features/tickets/queries/livreur-list.query';
import {
  creerProgrammeAction,
  listerProgrammesSemaineAction,
} from '@/features/turboys/actions/programme.actions';
import {
  useAutosuffisanceSemaineQuery,
  useEnvoyerProgrammeMutation,
  usePlanifierProgrammeMutation,
  useProgrammesIndependantsQuery,
  useProgrammesSemaineQuery,
  usePublierProgrammeMutation,
  useSupprimerProgrammeMutation,
} from '@/features/turboys/queries/programme.query';
import { IProgramme } from '@/features/turboys/types/programme.types';
import { totauxCarburant } from '@/features/turboys/utils/carburant.utils';
import {
  exporterProgrammesExcel,
  exporterProgrammesPdf,
} from '@/features/turboys/utils/programmes-export.utils';
import {
  lireFichierProgrammes,
  telechargerModeleProgrammes,
} from '@/features/turboys/utils/programmes-import.utils';
import { semaineCourante, semaineDecalee, semainePrecedente } from '@/features/turboys/utils/semaine.utils';
import { getTurboyTypeDisplay } from '@/features/turboys/utils/type-livreur-display';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';

/**
 * Les programmes hebdomadaires.
 *
 * <p>La conception et ses raisons sont documentées dans
 * `features/programmes/refonte/semaine-programmes.tsx`, qui porte le rendu. Ce fichier
 * ne fait plus que la lecture, les écritures et les deux imports.</p>
 */

const TYPE_OPTIONS = [
  { cle: 'TOUS', libelle: 'Tous' },
  { cle: 'JOURNALIER', libelle: getTurboyTypeDisplay('JOURNALIER').labelPlural },
  { cle: 'SUPERVISEUR_LIVREUR', libelle: getTurboyTypeDisplay('SUPERVISEUR_LIVREUR').labelPlural },
  { cle: 'INDEPENDANT', libelle: getTurboyTypeDisplay('INDEPENDANT').labelPlural },
];

/*
 * Le calendrier des semaines vit dans `semaine.utils.ts`, aligné sur le backend
 * (WeekFields FRANCE, année calendaire). Ce fichier calculait le numéro courant
 * correctement, mais changeait de semaine avec un 52 écrit en dur : depuis la semaine 1,
 * « précédente » sautait la 53 des années qui en ont une, et « suivante » depuis la 53
 * renvoyait sur la même semaine sous un autre nom.
 */
const CURRENT_WEEK = semaineCourante();

export default function ProgrammesSection() {
  const [{ annee, semaine }, setWeek] = useQueryStates({
    annee: parseAsInteger.withDefault(CURRENT_WEEK.annee),
    semaine: parseAsInteger.withDefault(CURRENT_WEEK.semaine),
  });

  const { data, isError, isLoading, refetch } = useProgrammesSemaineQuery(annee, semaine);
  const independantsQuery = useProgrammesIndependantsQuery(annee, semaine);
  const autosuffisanceQuery = useAutosuffisanceSemaineQuery(annee, semaine);

  // L'écart de carburant contre la semaine précédente : le document papier le donnait,
  // avec sa raison. La raison reste à l'opérateur ; le chiffre, lui, se calcule.
  const precedente = semainePrecedente(annee, semaine);
  const precedenteQuery = useProgrammesSemaineQuery(precedente.annee, precedente.semaine);
  const carburantSemainePrecedente = React.useMemo(() => {
    if (!Array.isArray(precedenteQuery.data) || precedenteQuery.data.length === 0) return null;
    return totauxCarburant(precedenteQuery.data).total;
  }, [precedenteQuery.data]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IProgramme | null>(null);
  const [apercu, setApercu] = React.useState<IProgramme | null>(null);
  const [carburantDe, setCarburantDe] = React.useState<IProgramme | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [lotEnCours, setLotEnCours] = React.useState(false);

  const planifier = usePlanifierProgrammeMutation();
  const publier = usePublierProgrammeMutation();
  const envoyer = useEnvoyerProgrammeMutation();
  const supprimer = useSupprimerProgrammeMutation();

  const changeWeek = (delta: number) => setWeek(semaineDecalee(annee, semaine, delta));

  const runAction = async (id: string, fn: (id: string) => Promise<unknown>) => {
    setPendingId(id);
    try {
      await fn(id);
    } catch {
      // erreur déjà signalée par le toast de la mutation
    } finally {
      setPendingId(null);
    }
  };

  const demanderSuppression = (p: IProgramme) => {
    const ok = window.confirm(
      `Supprimer le programme de ${p.livreurNom ?? 'ce livreur'} (semaine ${p.semaine}/${p.annee}) ?`,
    );
    if (ok) runAction(p.id, supprimer.mutateAsync);
  };

  /*
   * Publier en LOT. Le backend ne publie qu'un programme à la fois ; la boucle est ici,
   * séquentielle pour ne pas ouvrir quarante requêtes d'un coup, et le compte des échecs
   * est rendu. Sans elle, lancer une semaine de quarante livreurs demandait quarante
   * clics.
   */
  const publierLot = async (ids: string[]) => {
    if (ids.length === 0 || lotEnCours) return;
    setLotEnCours(true);
    let ok = 0;
    let echecs = 0;
    try {
      for (const id of ids) {
        try {
          await publier.mutateAsync(id);
          ok += 1;
        } catch {
          echecs += 1;
        }
      }
      if (echecs === 0) {
        toast.success(`${ok} programme(s) publié(s).`);
      } else {
        toast.warning(`${ok} publié(s), ${echecs} en échec.`);
      }
    } finally {
      setLotEnCours(false);
    }
  };

  const [typeFiltre, setTypeFiltre] = React.useState<string>('TOUS');
  const [partenaireFiltre, setPartenaireFiltre] = React.useState<string>('TOUS');
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants', 'all', 'programmes'],
    queryFn: getAllRestaurants,
    staleTime: 5 * 60 * 1000,
  });
  const restaurants = React.useMemo(
    () => (restaurantsQuery.data ?? []).map((r) => ({ id: r.id, nom: r.nomEtablissement })),
    [restaurantsQuery.data],
  );
  const livreursQuery = useLivreursListQuery();

  const programmesFiltres = React.useMemo(() => {
    // Durcissement : une réponse non-tableau (erreur backend renvoyée en 200,
    // shape inattendue…) ne doit jamais faire planter `.filter` au rendu.
    let liste = Array.isArray(data) ? data : [];
    if (typeFiltre !== 'TOUS') liste = liste.filter((p) => (p.typeLivreur ?? '') === typeFiltre);
    if (partenaireFiltre !== 'TOUS') {
      liste = liste.filter((p) =>
        (p.jours ?? []).some((j) => (j.postes ?? []).some((po) => po.restaurantId === partenaireFiltre)),
      );
    }
    return liste;
  }, [data, typeFiltre, partenaireFiltre]);

  // Importer = copier le planning de la semaine précédente (brouillons), pour
  // les livreurs qui n'ont pas déjà un programme cette semaine. Orchestré côté
  // front via creer + joursAvecDates (recalcule les dates de la semaine cible).
  const qc = useQueryClient();
  const [importing, setImporting] = React.useState(false);
  const copierSemainePrecedente = async () => {
    const { annee: srcAnnee, semaine: srcSemaine } = semainePrecedente(annee, semaine);
    setImporting(true);
    try {
      const sources = await listerProgrammesSemaineAction(srcAnnee, srcSemaine);
      const dejaPresent = new Set((data ?? []).map((p) => p.livreurId));
      const aCreer = sources.filter((p) => p.livreurId && !dejaPresent.has(p.livreurId));
      if (aCreer.length === 0) {
        toast.info(`Rien à importer depuis la semaine ${srcSemaine}/${srcAnnee}.`);
        return;
      }
      let ok = 0;
      for (const src of aCreer) {
        const r = await creerProgrammeAction({
          annee,
          jours: joursAvecDates(src.jours, annee, semaine),
          livreurId: src.livreurId!,
          semaine,
        });
        if (r.success) ok += 1;
      }
      await qc.invalidateQueries({ queryKey: ['programme'] });
      toast.success(`${ok} programme(s) importé(s) depuis la semaine ${srcSemaine}/${srcAnnee}.`);
    } catch {
      toast.error("Échec de l'import depuis la semaine précédente.");
    } finally {
      setImporting(false);
    }
  };

  // Import par fichier (.xlsx/.csv) : correspondance livreur par matricule puis
  // téléphone, création de brouillons pour la semaine affichée.
  const fileRef = React.useRef<HTMLInputElement>(null);
  const onFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const lignes = await lireFichierProgrammes(file);
      const normMat = (s?: string | null) => (s ?? '').trim().toUpperCase();
      const normTel = (s?: string | null) => (s ?? '').replace(/\D/g, '').slice(-10);
      const parMat = new Map<string, string>();
      const parTel = new Map<string, string>();
      for (const l of livreursQuery.data ?? []) {
        if (l.matricule) parMat.set(normMat(l.matricule), l.id);
        if (l.telephone) parTel.set(normTel(l.telephone), l.id);
      }
      const dejaPresent = new Set((data ?? []).map((p) => p.livreurId));
      let ok = 0;
      let nonTrouves = 0;
      let ignores = 0;
      for (const lg of lignes) {
        const id =
          (lg.matricule && parMat.get(normMat(lg.matricule))) ||
          (lg.telephone && parTel.get(normTel(lg.telephone))) ||
          null;
        if (!id) {
          nonTrouves += 1;
          continue;
        }
        if (dejaPresent.has(id)) {
          ignores += 1;
          continue;
        }
        const r = await creerProgrammeAction({
          annee,
          jours: joursAvecDates(lg.jours, annee, semaine),
          livreurId: id,
          semaine,
        });
        if (r.success) ok += 1;
        dejaPresent.add(id);
      }
      await qc.invalidateQueries({ queryKey: ['programme'] });
      const details = [nonTrouves ? `${nonTrouves} non trouvé(s)` : '', ignores ? `${ignores} déjà présent(s)` : '']
        .filter(Boolean)
        .join(', ');
      toast.success(`${ok} programme(s) importé(s)${details ? ` (${details})` : ''}.`);
    } catch {
      toast.error('Fichier illisible ou format invalide.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input accept=".xlsx,.csv" className="hidden" onChange={onFichier} ref={fileRef} type="file" />

      {/* Boundary rekeyé par semaine : un rendu qui throw sur les données d'une
          semaine n'emporte plus toute la page — et naviguer réarme l'affichage. */}
      <ErrorBoundary
        resetKey={`${annee}-${semaine}`}
        title="Impossible d'afficher les programmes de cette semaine"
      >
        <SemaineProgrammes
          annee={annee}
          autosuffisance={Array.isArray(autosuffisanceQuery.data) ? autosuffisanceQuery.data : []}
          autosuffisanceIsError={autosuffisanceQuery.isError}
          autosuffisanceIsLoading={autosuffisanceQuery.isLoading}
          carburantSemainePrecedente={carburantSemainePrecedente}
          engagement={
            <EngagementCarburantConnecte
              annee={annee}
              programmes={Array.isArray(data) ? data : []}
              semaine={semaine}
            />
          }
          idEnCours={pendingId}
          importEnCours={importing}
          independants={Array.isArray(independantsQuery.data) ? independantsQuery.data : []}
          independantsIsError={independantsQuery.isError}
          independantsIsLoading={independantsQuery.isLoading}
          isError={isError}
          isLoading={isLoading}
          lotEnCours={lotEnCours}
          onApercu={setApercu}
          onCarburant={setCarburantDe}
          onCopierSemainePrecedente={copierSemainePrecedente}
          onEditer={setEditing}
          onEnvoyer={(p) => runAction(p.id, envoyer.mutateAsync)}
          onExporterExcel={() => exporterProgrammesExcel(programmesFiltres, annee, semaine)}
          onExporterPdf={() =>
            exporterProgrammesPdf(
              programmesFiltres,
              annee,
              semaine,
              TYPE_OPTIONS.find((o) => o.cle === typeFiltre)?.libelle ?? 'Tous',
            )
          }
          onImporterFichier={() => fileRef.current?.click()}
          onNouveau={() => setCreateOpen(true)}
          onPartenaireFiltre={setPartenaireFiltre}
          onPlanifier={(p) => runAction(p.id, planifier.mutateAsync)}
          onPublier={(p) => runAction(p.id, publier.mutateAsync)}
          onPublierLot={publierLot}
          onReessayer={() => void refetch()}
          onReessayerIndependants={() => void independantsQuery.refetch()}
          onSemaine={changeWeek}
          onSupprimer={demanderSuppression}
          onTelechargerModele={() =>
            telechargerModeleProgrammes(
              (livreursQuery.data ?? []).map((l) => ({
                matricule: l.matricule,
                nom: `${l.prenoms ?? ''} ${l.nom ?? ''}`.trim(),
                telephone: l.telephone,
              })),
            )
          }
          onTypeFiltre={setTypeFiltre}
          partenaireFiltre={partenaireFiltre}
          partenaires={restaurants}
          partenairesEnCours={restaurantsQuery.isLoading}
          programmes={programmesFiltres}
          semaine={semaine}
          typeFiltre={typeFiltre}
          typeOptions={TYPE_OPTIONS}
        />
      </ErrorBoundary>

      <ProgrammeFormModal
        anneeInitiale={annee}
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        semaineInitiale={semaine}
      />
      <ProgrammeFormModal
        anneeInitiale={annee}
        isOpen={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        programme={editing}
        semaineInitiale={semaine}
      />
      <CarburantRapideModal
        isOpen={!!carburantDe}
        onOpenChange={(open) => {
          if (!open) setCarburantDe(null);
        }}
        programme={carburantDe}
      />
      <ProgrammeApercuModal
        annee={annee}
        isOpen={!!apercu}
        onOpenChange={(open) => {
          if (!open) setApercu(null);
        }}
        programme={apercu}
        semaine={semaine}
        telephone={(livreursQuery.data ?? []).find((l) => l.id === apercu?.livreurId)?.telephone ?? null}
      />
    </>
  );
}
