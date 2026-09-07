'use client';

import { useMemo, useState } from 'react';
import { Alert, Button, Chip, Meter } from '@heroui-v3/react';
import { useQuery } from '@tanstack/react-query';

import { ChampCopiable } from '@/components/commons/ChampCopiable';
import { ChampListe, ChampTexte } from '@/components/commons/champs-formulaire';
import EtatErreur from '@/components/commons/EtatErreur';
import { useTurboyQuery } from '@/features/turboys/queries/turboy-list.query';
import { getAllRestaurants } from '@/src/restaurants/restaurants.actions';
import {
  useChangerStatutPieceMutation,
  useClesQuery,
  useCoteQuery,
  useEmettreCleMutation,
  useEvenementsQuery,
  useValiderCompteMutation,
} from '@/features/turboys/queries/compte-livreur.queries';
import { PieceCible, PieceStatut, Rattachement } from '@/features/turboys/types/compte-livreur.types';
import { TurboyType } from '@/features/turboys/types/turboys.types';

const STATUT_COLOR: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  CONFORME: 'success',
  A_VERIFIER: 'warning',
  REFUSE: 'danger',
};
const STATUT_LABEL: Record<string, string> = {
  CONFORME: 'Conforme',
  A_VERIFIER: 'À vérifier',
  REFUSE: 'Refusé',
};

const PIECE_OPTIONS = [
  { label: 'Conforme', value: 'CONFORME' },
  { label: 'À vérifier', value: 'A_VERIFIER' },
  { label: 'Refusé', value: 'REFUSE' },
] as const;

const TYPE_OPTIONS = [
  { label: 'Indépendant', value: 'INDEPENDANT' },
  { label: 'Journalier', value: 'JOURNALIER' },
  { label: 'Superviseur-livreur', value: 'SUPERVISEUR_LIVREUR' },
] as const;

const RATTACHEMENT_OPTIONS = [
  { label: 'Site partenaire — assigné', value: 'SITE_PARTNER' },
  { label: 'BIRD — non rattaché (libre)', value: 'BIRD' },
] as const;

/**
 * Les statuts d'une clé, écrits pour être lus.
 *
 * <p>Ils étaient affichés BRUTS dans la pastille : « CONSOMMEE », « REVOQUEE », en
 * capitales et sans accents. Et « consommée » — l'état NORMAL d'une clé qu'un livreur a
 * utilisée — était peint en rouge de marque, la couleur des choses à traiter.</p>
 */
const CLE_STATUT: Record<string, { libelle: string; ton: 'danger' | 'default' | 'success' }> = {
  ACTIVE: { libelle: 'Active', ton: 'success' },
  CONSOMMEE: { libelle: 'Consommée', ton: 'default' },
  EXPIREE: { libelle: 'Expirée', ton: 'default' },
  REVOQUEE: { libelle: 'Révoquée', ton: 'danger' },
};

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('fr-FR');
}

interface PieceRowProps {
  driverId: string;
  cible: PieceCible;
  libelle: string;
  statut: PieceStatut;
  motif: string | null;
}

function PieceRow({ driverId, cible, libelle, statut, motif }: PieceRowProps) {
  const [valeur, setValeur] = useState<PieceStatut>(statut);
  const [motifRefus, setMotifRefus] = useState<string>(motif ?? '');
  const mutation = useChangerStatutPieceMutation(driverId);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-separator p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">{libelle}</span>
        <Chip color={STATUT_COLOR[statut]} size="sm" variant="soft">
          <Chip.Label>{STATUT_LABEL[statut]}</Chip.Label>
        </Chip>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="w-full sm:w-44">
          <ChampListe
            label={`Statut — ${libelle}`}
            onChange={(v) => setValeur((v || 'A_VERIFIER') as PieceStatut)}
            options={PIECE_OPTIONS}
            valeur={valeur}
          />
        </div>
        {valeur === 'REFUSE' && (
          <div className="w-full sm:w-56">
            <ChampTexte
              label="Motif du refus"
              onChange={setMotifRefus}
              placeholder="Pourquoi la pièce est refusée"
              valeur={motifRefus}
            />
          </div>
        )}
        <Button
          className="shrink-0"
          isPending={mutation.isPending}
          onPress={() =>
            mutation.mutate({
              motif: valeur === 'REFUSE' ? motifRefus : undefined,
              piece: cible,
              statut: valeur,
            })
          }
          variant="primary"
        >
          Enregistrer
        </Button>
      </div>
    </div>
  );
}

const sectionClass = 'bg-surface rounded-xl border border-separator shadow-xs p-6';
/* Les cinq titres de section etaient peints en ROUGE DE MARQUE. */
const titleClass = 'text-base font-semibold text-foreground mb-4';

export default function CompteHabilitationPanel({ driverId }: { driverId: string }) {
  const { data: turboy, isLoading, isError, isFetching, refetch } = useTurboyQuery(driverId);
  const cles = useClesQuery(driverId);
  const evenements = useEvenementsQuery(driverId);
  const cote = useCoteQuery(driverId);
  const restaurantsQuery = useQuery({
    queryKey: ['restaurants', 'all', 'habilitation'],
    queryFn: getAllRestaurants,
    staleTime: 5 * 60 * 1000,
  });
  const restaurants = useMemo(
    () => (restaurantsQuery.data ?? []).map((r) => ({ id: r.id, nom: r.nomEtablissement })),
    [restaurantsQuery.data],
  );

  const [typeLivreur, setTypeLivreur] = useState<TurboyType>('INDEPENDANT');
  const [rattachement, setRattachement] = useState<Rattachement>('SITE_PARTNER');
  const [sitePartnerId, setSitePartnerId] = useState('');
  const [codeEmis, setCodeEmis] = useState<string | null>(null);

  const valider = useValiderCompteMutation(driverId, (vm) => setCodeEmis(vm.code));
  const emettre = useEmettreCleMutation(driverId, (cle) => setCodeEmis(cle.code));

  if (isLoading) {
    return (
      <section className={`${sectionClass} flex flex-col gap-3`}>
        <div className="h-6 w-48 animate-pulse rounded bg-surface-secondary" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-surface-secondary" />
        <div className="h-24 w-full animate-pulse rounded-lg bg-surface-secondary" />
      </section>
    );
  }

  // Sans la fiche, aucune section de l ecran n a de sens. La garde precedente
  // renvoyait le meme spinner qu au chargement : apres un echec, l ecran tournait
  // indefiniment sans jamais dire que la lecture avait echoue.
  if (isError || !turboy) {
    return (
      <section className={sectionClass}>
        <EtatErreur quoi="la fiche du livreur" onReessayer={() => void refetch()} enCours={isFetching} />
      </section>
    );
  }

  const cni = (turboy.cniStatut ?? 'A_VERIFIER') as PieceStatut;
  const fiche = (turboy.ficheStatut ?? 'A_VERIFIER') as PieceStatut;
  const contrat = (turboy.contratStatut ?? 'A_VERIFIER') as PieceStatut;
  const toutConforme = cni === 'CONFORME' && fiche === 'CONFORME' && contrat === 'CONFORME';
  const siteManquant = rattachement === 'SITE_PARTNER' && !sitePartnerId.trim();
  const dejaValide = (turboy.status ?? 0) >= 4;

  const score = cote.data?.cote ?? turboy.cote ?? null;
  const coteColor: 'success' | 'warning' | 'danger' | 'default' =
    score == null ? 'default' : score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
  const coteLabel = score == null ? 'Non évaluée' : score >= 80 ? 'Fiable' : score >= 50 ? 'Moyenne' : 'Faible';

  return (
    <div className="space-y-6">
      {/* Cote de fiabilité (RG-29) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Cote de fiabilité</h2>
        {cote.isLoading ? (
          <div className="h-16 w-full animate-pulse rounded-lg bg-surface-secondary" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums text-foreground">
                {score ?? '—'}
                <span className="ml-0.5 text-base font-normal text-muted">/100</span>
              </span>
              <Chip color={coteColor} variant="soft">
                <Chip.Label>{coteLabel}</Chip.Label>
              </Chip>
            </div>
            {/*
             * La barre etait un `<div>` peint en `bg-green-500` / `bg-amber-500` /
             * `bg-red-500` — trois couleurs Tailwind brutes, sans variante sombre, et
             * annoncees a AUCUN lecteur d'ecran : le chiffre a cote, lui, l'etait. Le
             * `Meter` de la v3 porte le seuil, la valeur et son role.
             */}
            <Meter className="mt-3" color={coteColor} maxValue={100} value={score ?? 0}>
              <Meter.Track>
                <Meter.Fill />
              </Meter.Track>
            </Meter>
            {/* La cote elle-meme vient de la fiche : seul l historique manque ici.
                « Aucune variation enregistree » ferait croire a une cote jamais
                touchee, alors que l historique n a pas pu etre lu. */}
            {cote.isError ? (
              <EtatErreur
                quoi="l’historique de la cote"
                onReessayer={() => void cote.refetch()}
                enCours={cote.isFetching}
              />
            ) : cote.data && cote.data.historique.length > 0 ? (
              <ul className="mt-4 space-y-1.5 text-sm text-muted">
                {cote.data.historique.slice(0, 8).map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-2">
                    <span className="text-muted">{formatDate(h.horodatage)}</span>
                    <Chip color={h.delta < 0 ? 'danger' : 'success'} size="sm" variant="soft">
                      <Chip.Label>{h.delta > 0 ? `+${h.delta}` : h.delta}</Chip.Label>
                    </Chip>
                    {h.raison && <span>{h.raison}</span>}
                    <span className="text-muted">→ {h.coteApres}/100</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted">Aucune variation enregistrée.</p>
            )}
          </>
        )}
      </section>

      {/* Conformité des pièces (RG-05) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Conformité des pièces</h2>
        <div className="space-y-3">
          <PieceRow driverId={driverId} cible="CNI" libelle="CNI" statut={cni} motif={turboy.cniMotifRefus} />
          <PieceRow driverId={driverId} cible="FICHE" libelle="Fiche d’identification" statut={fiche} motif={turboy.ficheMotifRefus} />
          <PieceRow driverId={driverId} cible="CONTRAT" libelle="Contrat" statut={contrat} motif={turboy.contratMotifRefus} />
        </div>
      </section>

      {/* Validation du compte (RG-07) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Validation du compte</h2>
        {dejaValide ? (
          <Chip color="success" variant="soft">
            <Chip.Label>Compte déjà validé{turboy.type ? ` — ${turboy.type}` : ''}</Chip.Label>
          </Chip>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* « Superviseur » ici, « Superviseur-livreur » partout ailleurs : deux noms
                  pour la meme population, dans un champ qui decide du circuit de paie. */}
              <ChampListe
                label="Type de livreur"
                onChange={(v) => setTypeLivreur((v || 'INDEPENDANT') as TurboyType)}
                options={TYPE_OPTIONS}
                valeur={typeLivreur}
              />
              <ChampListe
                label="Rattachement"
                onChange={(v) => setRattachement((v || 'SITE_PARTNER') as Rattachement)}
                options={RATTACHEMENT_OPTIONS}
                valeur={rattachement}
              />
              {rattachement === 'SITE_PARTNER' &&
                (restaurantsQuery.isError ? (
                  /* getAllRestaurants relance desormais. Une liste illisible donnait un
                     champ de recherche muet : le site restait vide, la validation restait
                     bloquee par siteManquant, et rien ne disait que la lecture avait echoue. */
                  <EtatErreur
                    quoi="la liste des sites partenaires"
                    onReessayer={() => void restaurantsQuery.refetch()}
                    enCours={restaurantsQuery.isFetching}
                  />
                ) : (
                  <ChampListe
                    label="Site partenaire"
                    onChange={setSitePartnerId}
                    options={restaurants.map((r) => ({ label: r.nom, value: r.id }))}
                    placeholder="Rechercher un partenaire"
                    valeur={sitePartnerId}
                  />
                ))}
              <p className="col-span-full text-xs text-muted">
                Le rattachement est indépendant du type de livreur : tout contrat
                (y compris journalier / superviseur) peut être BIRD ou assigné.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">
                {toutConforme
                  ? 'Les 3 pièces sont conformes — validation possible.'
                  : 'Les 3 pièces doivent être conformes avant de valider.'}
              </p>
              <Button
                isDisabled={!toutConforme || siteManquant}
                isPending={valider.isPending}
                variant="primary"
                onPress={() =>
                  valider.mutate({
                    typeLivreur,
                    rattachement,
                    sitePartnerId: rattachement === 'SITE_PARTNER' ? sitePartnerId.trim() : null,
                  })
                }
              >
                Valider le compte
              </Button>
            </div>
          </>
        )}
      </section>

      {/* Clé d'activation (RG-08/10) */}
      <section className={sectionClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Clé d’activation</h2>
          <Button
            isPending={emettre.isPending}
            onPress={() => emettre.mutate(undefined)}
            size="sm"
            variant="outline"
          >
            Réémettre une clé (changer d’appareil)
          </Button>
        </div>
        {/* Clé fraîchement émise (validation OU réémission) — affichée ICI, au même
            niveau que le bouton, plus en bandeau tout en haut de la page. */}
        {/*
         * La cle fraichement emise etait affichee sur un bloc peint a la main :
         * `border-green-200 bg-green-50 text-green-800 text-green-900 text-green-700`.
         * Cinq nuances de la palette Tailwind brute, sans AUCUNE variante sombre — sur un
         * poste en theme sombre, le code a communiquer au livreur, qu'on ne reverra
         * jamais, etait du vert fonce sur du vert clair sur fond noir. Et il n'y avait pas
         * de bouton pour le copier : il fallait le recopier a la main, chiffre par chiffre.
         */}
        {codeEmis && (
          <Alert className="mb-4" status="success">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Clé d’activation — à communiquer une seule fois au livreur</Alert.Title>
              <ChampCopiable className="mt-2" valeur={codeEmis} />
              <Button
                className="mt-1"
                onPress={() => setCodeEmis(null)}
                size="sm"
                variant="ghost"
              >
                Masquer
              </Button>
            </Alert.Content>
          </Alert>
        )}
        <p className="mb-1 text-xs text-muted">
          Appareil lié : {turboy.deviceLabel ?? turboy.deviceId ?? '— aucun'}
        </p>
        <p className="mb-3 text-xs text-muted">
          Réémettre une clé délie l’appareil actuel : le livreur pourra se
          connecter sur un nouveau téléphone en saisissant la nouvelle clé.
        </p>
        {cles.isLoading ? (
          <div className="h-12 w-full animate-pulse rounded-lg bg-surface-secondary" />
        ) : cles.isError ? (
          /* « Aucune cle emise » pousse a en reemettre une, ce qui delie l appareil
             du livreur. On ne le laisse pas conclure sur une lecture qui a echoue. */
          <EtatErreur
            quoi="les clés d’activation"
            onReessayer={() => void cles.refetch()}
            enCours={cles.isFetching}
          />
        ) : cles.data && cles.data.length > 0 ? (
          <div className="space-y-1.5">
            {cles.data.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <Chip color={CLE_STATUT[c.statut]?.ton ?? 'default'} size="sm" variant="soft">
                  <Chip.Label>{CLE_STATUT[c.statut]?.libelle ?? c.statut}</Chip.Label>
                </Chip>
                <span className="font-mono">••••{c.codeApercu ?? '????'}</span>
                {c.expireLe && <span className="text-muted">exp. {formatDate(c.expireLe)}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucune clé émise.</p>
        )}
      </section>

      {/* Historique (RG-11) */}
      <section className={sectionClass}>
        <h2 className={titleClass}>Historique du compte</h2>
        {evenements.isLoading ? (
          <div className="h-12 w-full animate-pulse rounded-lg bg-surface-secondary" />
        ) : evenements.isError ? (
          <EtatErreur
            quoi="l’historique du compte"
            onReessayer={() => void evenements.refetch()}
            enCours={evenements.isFetching}
          />
        ) : evenements.data && evenements.data.length > 0 ? (
          <ul className="space-y-1.5 text-sm text-muted">
            {evenements.data.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2">
                <span className="text-muted">{formatDate(e.horodatage)}</span>
                <Chip size="sm" variant="soft">
                  <Chip.Label>{e.type}</Chip.Label>
                </Chip>
                {e.auteurRole && <span className="text-muted">par {e.auteurRole}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Aucun événement.</p>
        )}
      </section>
    </div>
  );
}
