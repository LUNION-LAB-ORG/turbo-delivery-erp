'use client';

import { Button, Card, Spinner, Switch } from '@heroui-v3/react';
import { Banknote, Plus, Save, Settings2, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import EtatErreur from '@/components/commons/EtatErreur';
import { ChampListe, ChampNombre, ChampTexte } from '@/components/finance/common/champs-finance';
import { CategorieDepenseList } from '@/features/depenses/components/depense-list/categorie-depense';
import {
  IModuleConfig,
  useModuleConfigQuery,
  useUpdateModuleConfigMutation,
} from '@/features/finances-config';

const DEVISES = ['FCFA', 'EUR', 'USD'].map((d) => ({ label: d, value: d }));

function Section({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof Settings2;
  title: string;
}) {
  return (
    <Card>
      <Card.Content className="gap-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon aria-hidden="true" className="size-4 text-muted" />
          {title}
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </Card.Content>
    </Card>
  );
}

/**
 * Les parametres globaux du module Finances.
 *
 * <h3>Ce que l'operateur regarde en premier</h3>
 * <p>Il ne vient pas LIRE cette page, il vient y changer UNE valeur. Ce qu'il lui faut
 * en premier n'est donc aucun des reglages : c'est de savoir si sa saisie est ecrite ou
 * non. Rien ne le disait, le bouton d'enregistrement ayant exactement le meme aspect
 * avant et apres une modification. L'accent n'apparait desormais que lorsqu'il y a
 * quelque chose a ecrire, et le mot le dit a cote.</p>
 *
 * <h3>Ce qui appelle un geste</h3>
 * <p>Enregistrer, ajouter et retirer un compte. Tout le reste informe, donc ne porte
 * pas de couleur. Le retrait d'un compte detruit une ligne sans confirmation : il garde
 * la teinte du danger, et ils sont assez peu nombreux pour qu'elle avertisse encore.</p>
 *
 * <h3>La forme naturelle</h3>
 * <p>Un formulaire, groupe par SUJET et non par ordre d'arrivee dans le modele. Le jour
 * de generation automatique etait range sous « General » alors qu'il ne concerne que les
 * charges fixes, dont la validation etait, elle, dans l'autre carte : les deux moities
 * d'une meme decision se lisaient a deux endroits. Elles sont ensemble. Le CA de
 * reference, qui occupait une carte entiere pour un seul champ, rejoint les autres
 * grandeurs de reference. Les comptes de tresorerie prennent la pleine largeur, parce
 * qu'un libelle de banque ne tient pas dans une demi-colonne de 480 px.</p>
 *
 * <p>La grille s'ouvrait a `lg:` (1024 px) alors que la fenetre reelle du poste fait
 * ~1000 px : elle ne s'est jamais ouverte chez l'operateur, qui lisait quatre cartes
 * empilees. Elle s'ouvre a `md:`.</p>
 */
export function FinanceConfigView() {
  const { data, isError, isFetching, isLoading, refetch } = useModuleConfigQuery();
  const update = useUpdateModuleConfigMutation();
  const [form, setForm] = useState<IModuleConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  // `form` est toujours un etalement de `data` : l'ordre des cles est conserve, la
  // comparaison textuelle suffit et ne peut pas manquer un changement de valeur.
  const modifie = useMemo(
    () => Boolean(form && data) && JSON.stringify(form) !== JSON.stringify(data),
    [data, form],
  );

  // Cette garde passe avant celle du chargement : sur echec `form` reste null et
  // l'ecran restait fige sur le spinner, comme si la donnee arrivait encore.
  if (isError) {
    return (
      <div className="p-4">
        <EtatErreur enCours={isFetching} onReessayer={() => refetch()} quoi="la configuration" />
      </div>
    );
  }

  if (isLoading || !form) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24">
        <Spinner />
        <p className="text-sm text-muted">Chargement de la configuration…</p>
      </div>
    );
  }

  const set = <K extends keyof IModuleConfig>(k: K, v: IModuleConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const comptes = form.comptesTresorerie ?? [];
  const setCompte = (i: number, patch: Partial<IModuleConfig['comptesTresorerie'][number]>) =>
    set(
      'comptesTresorerie',
      comptes.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );
  const addCompte = () => set('comptesTresorerie', [...comptes, { libelle: '', type: 'BANQUE' }]);
  const removeCompte = (i: number) =>
    set(
      'comptesTresorerie',
      comptes.filter((_, idx) => idx !== i),
    );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Configuration Finances</h1>
        <div className="flex items-center gap-3">
          {/* Cette mention INFORME d'un etat, elle n'avertit d'aucun danger : elle etait en
              teinte d'avertissement a cote du bouton qui vient de passer en accent, soit
              deux signaux pour une seule information. Le bouton porte le geste, le texte
              se contente de le nommer. */}
          {modifie && <span className="text-xs text-muted">Modifications non enregistrées</span>}
          <Button
            isDisabled={!modifie}
            isPending={update.isPending}
            onPress={() => update.mutate(form)}
            variant={modifie ? 'primary' : 'secondary'}
          >
            {update.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section icon={Settings2} title="Général">
          <ChampListe
            label="Devise"
            onChange={(v) => set('devise', v || 'FCFA')}
            options={DEVISES}
            valeur={form.devise}
          />
          <ChampNombre
            aide="Sert au coût journalier (prorata)"
            label="Nombre de jours du mois"
            onChange={(v) => set('nbJoursMois', v)}
            valeur={form.nbJoursMois}
          />
          <ChampListe
            aide="D'où vient le chiffre d'affaires servant de référence"
            label="Source du CA"
            onChange={(v) => set('caSource', (v || 'AUTO') as IModuleConfig['caSource'])}
            options={[
              { label: 'Auto (module CA)', value: 'AUTO' },
              { label: 'Manuel (saisi)', value: 'MANUEL' },
            ]}
            valeur={form.caSource}
          />
          {form.caSource === 'MANUEL' && (
            <ChampNombre
              label={`CA journalier moyen (${form.devise})`}
              onChange={(v) => set('caReference', v)}
              valeur={form.caReference ?? 0}
            />
          )}
        </Section>

        <Section icon={ShieldCheck} title="Validation et génération">
          <ChampNombre
            aide="Jusqu'à ce montant le visa DGA suffit ; au-delà l'accord du DG est requis"
            label={`Seuil d'autonomie DGA (${form.devise})`}
            onChange={(v) => set('seuilDga', v)}
            valeur={form.seuilDga}
          />
          <ChampListe
            label="Mode de traitement"
            onChange={(v) => set('modeTraitement', (v || 'UNITE') as IModuleConfig['modeTraitement'])}
            options={[
              { label: "À l'unité (notif à chaque dépense)", value: 'UNITE' },
              { label: 'Panier groupé (1×/jour)', value: 'PANIER' },
            ]}
            valeur={form.modeTraitement}
          />
          <ChampNombre
            aide="Jour du mois où les charges fixes sont créées, de 1 à 28"
            label="Jour de génération auto"
            max={28}
            min={1}
            onChange={(v) => set('jourGenerationAuto', v || 1)}
            valeur={form.jourGenerationAuto}
          />
          <ChampListe
            aide="Ce qu'il advient des charges ainsi créées"
            label="Validation charges fixes"
            onChange={(v) =>
              set(
                'validationChargesFixes',
                (v || 'MANUELLE') as IModuleConfig['validationChargesFixes'],
              )
            }
            options={[
              { label: 'Manuelle (mensuelle)', value: 'MANUELLE' },
              { label: 'Auto (après visa DGA)', value: 'AUTO' },
            ]}
            valeur={form.validationChargesFixes}
          />
          <div className="flex items-center justify-between gap-3 rounded-lg border border-separator px-3 py-2 sm:col-span-2">
            <Switch
              isSelected={form.clausePassageForce}
              onChange={(v) => set('clausePassageForce', v)}
            >
              <Switch.Content className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium text-foreground">Clause de passage forcé</span>
                <span className="text-xs text-muted">
                  Le DGA peut forcer un décaissement urgent si le DG est indisponible (tracé)
                </span>
              </Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
        </Section>
      </div>

      <Card>
        <Card.Content className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Banknote aria-hidden="true" className="size-4 text-muted" />
              Comptes de trésorerie
              {comptes.length > 0 && (
                <span className="text-xs font-normal tabular-nums text-muted">
                  {comptes.length}
                </span>
              )}
            </span>
            <Button onPress={addCompte} size="sm" variant="outline">
              <Plus aria-hidden="true" className="size-4" />
              Ajouter
            </Button>
          </div>

          {comptes.length === 0 && (
            <p className="py-2 text-sm text-muted">Aucun compte. Ajoutez la caisse et vos banques.</p>
          )}

          {comptes.map((c, i) => (
            <div className="flex items-end gap-2" key={`compte-${i}`}>
              <div className="flex-1">
                <ChampTexte
                  label="Libellé"
                  onChange={(v) => setCompte(i, { libelle: v })}
                  placeholder="Ex. Banque Atlantique"
                  valeur={c.libelle}
                />
              </div>
              <div className="w-36">
                <ChampListe
                  label="Type"
                  onChange={(v) => setCompte(i, { type: (v || 'BANQUE') as 'BANQUE' | 'CAISSE' })}
                  options={[
                    { label: 'Caisse', value: 'CAISSE' },
                    { label: 'Banque', value: 'BANQUE' },
                  ]}
                  valeur={c.type}
                />
              </div>
              {/* Le retrait est immediat et sans confirmation : il garde la teinte du
                  danger, et les comptes sont assez peu nombreux pour qu'elle avertisse
                  encore. Sur les categories, ou la ligne se repete dix fois et plus,
                  c'est l'inverse. */}
              <Button
                aria-label={`Retirer le compte ${c.libelle || i + 1}`}
                isIconOnly
                onPress={() => removeCompte(i)}
                variant="danger-soft"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
          ))}
        </Card.Content>
      </Card>

      {/*
       * Le referentiel des categories se regle une fois, comme le reste de cette page,
       * et non a chaque saisie de depense : il est ici. Il reste monte par l'onglet
       * « Liste des categories » de la page Depenses, soit deux entrees pour une meme
       * liste.
       */}
      <CategorieDepenseList />
    </div>
  );
}
