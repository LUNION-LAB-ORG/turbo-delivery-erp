'use client';

import { Switch } from '@heroui-v3/react';
import { Control, Controller, FieldErrors, FieldValues, Path } from 'react-hook-form';

import {
  ChampDate,
  ChampListe,
  ChampMontant,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import { ICategorieDepense } from '@/features/depenses/types/categorie-depense.type';
import { IInvestissement } from '@/features/revenus/types/revenus.types';
import { formatCFA } from '@/src/actions/bonLivraison.mapper';

const STATUTS = [
  { label: 'Payée', value: 'PAID' },
  { label: 'En attente', value: 'PENDING' },
] as const;

const SOURCES = [
  { label: 'Espèces', value: 'especes' },
  { label: 'Wave', value: 'wave' },
  { label: 'Orange Money', value: 'orange-money' },
  { label: 'MTN MoMo', value: 'mtn-momo' },
  { label: 'Moov money', value: 'moov-money' },
  { label: 'Autre', value: 'autre' },
] as const;

const TYPES = [
  { label: 'Fixe', value: 'FIXE' },
  { label: 'Variable', value: 'VARIABLE' },
] as const;

const PERIODICITES = [
  { label: 'Quotidien', value: 'QUOTIDIEN' },
  { label: 'Hebdomadaire', value: 'HEBDOMADAIRE' },
  { label: 'Mensuel', value: 'MENSUEL' },
  { label: 'Annuel', value: 'ANNUEL' },
] as const;

/** Sentinelle du choix « pas d'investisseur » : une liste ne se choisit pas avec une clef vide. */
const AUCUN_INVESTISSEUR = 'aucun';

/** La date circule en `Date` dans le formulaire, en texte dans le champ de saisie. */
const versTexte = (valeur: unknown): string => {
  if (!(valeur instanceof Date) || Number.isNaN(valeur.getTime())) return '';
  const mois = String(valeur.getMonth() + 1).padStart(2, '0');
  const jour = String(valeur.getDate()).padStart(2, '0');
  return `${valeur.getFullYear()}-${mois}-${jour}`;
};

/*
 * `new Date('2026-09-08')` est lu comme MINUIT UTC : a l'ouest de Greenwich la date
 * recule d'un jour. Le suffixe d'heure locale garde le jour saisi.
 */
const versDate = (texte: string): Date | undefined =>
  texte ? new Date(`${texte}T00:00:00`) : undefined;

/*
 * Le formulaire est generique sur les valeurs : la creation exige la categorie, le
 * montant et la date, la modification les rend toutes facultatives. Un `Control<any>`
 * n'accepterait NI l'un NI l'autre, car react-hook-form type ses controles de facon
 * invariante, et il forcerait un transtypage chez chaque appelant.
 */
interface DepenseFormProps<T extends FieldValues> {
  categories: ICategorieDepense[] | undefined;
  categoriesLoading: boolean;
  control: Control<T>;
  errors: FieldErrors<T>;
  investissements: IInvestissement[];
  investissementsLoading: boolean;
  /** La depense revient a intervalle regulier : le rythme et la periodicite s'ouvrent. */
  estRecurrente: boolean;
  onEstRecurrenteChange: (valeur: boolean) => void;
}

/**
 * La saisie d'une depense, partagee par la creation et la modification.
 *
 * <h3>Ce qui change</h3>
 * <p>Le formulaire montait TROIS bibliotheques pour une seule ligne de saisie : un
 * `Label`, un `Input` et un `<p className="text-red-500">` pour l'erreur. Ce rouge-la
 * n'avait pas de variante sombre, et il ne touchait pas le champ : la bordure restait
 * neutre a cote d'un message rouge, et rien ne reliait l'un a l'autre pour un lecteur
 * d'ecran. Les champs de la maison portent l'erreur SUR le champ.</p>
 *
 * <p>Les cinq listes deroulantes ne se cherchaient pas. Sur les categories de depense, qui se
 * comptent par dizaines, et sur les investissements, cela voulait dire derouler la
 * liste entiere pour en trouver un. Ce sont des listes CHERCHABLES.</p>
 *
 * <p>La date se choisissait dans un calendrier ouvert par un bouton dont le libelle etait
 * la date elle-meme, sans champ de saisie : impossible de taper « 03/09 » au clavier. Le
 * champ de date de la maison se tape ET se choisit.</p>
 *
 * <p>Le montant etait un `<input type="number">` libre, dont la valeur repartait par un
 * `parseFloat` pose a la main. Il est saisi en entier positif, formate a la francaise.</p>
 */
export function DepenseForm<T extends FieldValues>({
  categories,
  categoriesLoading,
  control,
  errors,
  investissements,
  investissementsLoading,
  estRecurrente,
  onEstRecurrenteChange,
}: DepenseFormProps<T>) {
  const optionsCategorie = (categories ?? []).map((c) => ({
    label: c.nomCategorie,
    value: c.id,
  }));

  const optionsInvestissement = [
    { label: 'Aucun investisseur', value: AUCUN_INVESTISSEUR },
    ...investissements.map((i) => ({
      label: `${i.nomInvestisseur} - ${formatCFA(i.montant)}`,
      value: i.id,
    })),
  ];

  const champ = (nom: string) => nom as Path<T>;
  const message = (nom: string) =>
    (errors as FieldErrors)[nom]?.message as string | undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name={champ('dateDepense')}
          render={({ field }) => (
            <ChampDate
              erreur={message('dateDepense')}
              label="Date de comptabilisation *"
              onChange={(v) => field.onChange(versDate(v))}
              valeur={versTexte(field.value)}
            />
          )}
        />

        <Controller
          control={control}
          name={champ('montant')}
          render={({ field }) => (
            <ChampMontant
              erreur={message('montant')}
              label="Montant de la dépense *"
              onChange={(v) => field.onChange(Number.isNaN(v) ? 0 : v)}
              valeur={field.value as number | undefined}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name={champ('statut')}
        render={({ field }) => (
          <ChampListe
            erreur={message('statut')}
            label="Statut de la dépense *"
            onChange={field.onChange}
            options={STATUTS}
            placeholder="Sélectionnez le statut"
            valeur={(field.value as string) ?? ''}
          />
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name={champ('categorieDepense')}
          render={({ field }) => (
            <ChampListe
              erreur={message('categorieDepense')}
              estDesactive={categoriesLoading}
              label="Catégorie de dépenses *"
              messageListeVide="Aucune catégorie enregistrée"
              onChange={field.onChange}
              options={optionsCategorie}
              placeholder={categoriesLoading ? 'Chargement…' : 'Rechercher une catégorie'}
              valeur={(field.value as string) ?? ''}
            />
          )}
        />

        <Controller
          control={control}
          name={champ('sourcePaiement')}
          render={({ field }) => (
            <ChampListe
              erreur={message('sourcePaiement')}
              label="Source"
              onChange={field.onChange}
              options={SOURCES}
              placeholder="Sélectionnez une source"
              valeur={(field.value as string) ?? ''}
            />
          )}
        />
      </div>

      <Controller
        control={control}
        name={champ('description')}
        render={({ field }) => (
          <ChampZoneTexte
            erreur={message('description')}
            label="Description *"
            onChange={field.onChange}
            placeholder="À quoi correspond cette dépense ?"
            valeur={(field.value as string) ?? ''}
          />
        )}
      />

      <div className="flex flex-col gap-4">
        {/* Le libelle vit DANS `Switch.Content`, qui est le `<label>` : pose a cote, il
            ne bascule rien quand on le clique. */}
        <Switch isSelected={estRecurrente} onChange={onEstRecurrenteChange}>
          <Switch.Content>
            <Switch.Thumb />
            <span className="ms-2 text-sm text-foreground">Dépense récurrente (fixe)</span>
          </Switch.Content>
        </Switch>

        {estRecurrente && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name={champ('typeDepense')}
              render={({ field }) => (
                <ChampListe
                  erreur={message('typeDepense')}
                  label="Type de dépense"
                  onChange={field.onChange}
                  options={TYPES}
                  placeholder="Fixe ou variable"
                  valeur={(field.value as string) ?? ''}
                />
              )}
            />

            <Controller
              control={control}
              name={champ('periodicite')}
              render={({ field }) => (
                <ChampListe
                  erreur={message('periodicite')}
                  label="Périodicité"
                  onChange={field.onChange}
                  options={PERIODICITES}
                  placeholder="À quel rythme ?"
                  valeur={(field.value as string) ?? ''}
                />
              )}
            />
          </div>
        )}
      </div>

      <Controller
        control={control}
        name={champ('investissementId')}
        render={({ field }) => (
          <ChampListe
            erreur={message('investissementId')}
            estDesactive={investissementsLoading}
            label="Investissement (optionnel)"
            onChange={(v) => field.onChange(v === AUCUN_INVESTISSEUR ? '' : v)}
            options={optionsInvestissement}
            placeholder={
              investissementsLoading ? 'Chargement…' : 'Rechercher un investissement'
            }
            valeur={(field.value as string) || AUCUN_INVESTISSEUR}
          />
        )}
      />
    </div>
  );
}

export default DepenseForm;
