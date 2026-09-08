'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import {
  ChampListe,
  ChampMontant,
  ChampTexte,
  ChampZoneTexte,
} from '@/components/commons/champs-formulaire';
import {
  entreeCaisseSchema,
  type EntreeCaisseCreateDTO,
} from '@/features/entrees-caisse/schemas/entree-caisse.schema';

const MOIS = [
  { label: 'Janvier', value: '01' },
  { label: 'Février', value: '02' },
  { label: 'Mars', value: '03' },
  { label: 'Avril', value: '04' },
  { label: 'Mai', value: '05' },
  { label: 'Juin', value: '06' },
  { label: 'Juillet', value: '07' },
  { label: 'Août', value: '08' },
  { label: 'Septembre', value: '09' },
  { label: 'Octobre', value: '10' },
  { label: 'Novembre', value: '11' },
  { label: 'Décembre', value: '12' },
];

const currentYear = new Date().getFullYear();
const ANNEES = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => {
  const annee = String(2024 + i);
  return { label: annee, value: annee };
});

const STATUTS = [
  { label: 'Non payée', value: 'non_paye' },
  { label: 'Payée', value: 'paye' },
];

function buildDateEntree(month: string, year: string): string {
  return `${year}-${month}-05`;
}

function parseDateEntree(dateEntree: string): { month: string; year: string } {
  const [year, month] = dateEntree.split('-');
  return { month, year };
}

interface EntreeCaisseFormProps {
  defaultValues?: Partial<EntreeCaisseCreateDTO>;
  onSubmit: (data: EntreeCaisseCreateDTO) => Promise<void>;
  /**
   * Le formulaire prete sa soumission a la fenetre qui l'entoure.
   *
   * <p>Le pied de page appartient a la fenetre partagee, qui rend deja le retrait. Sans ce
   * relais il faudrait un second pied DANS le formulaire, donc deux boutons « Annuler »
   * l'un au-dessus de l'autre. Le bouton d'action reste celui de la fenetre, et c'est lui
   * qui declenche la validation du schema.</p>
   */
  soumission: React.RefObject<(() => void) | null>;
}

/**
 * Le formulaire d'une entree de caisse.
 *
 * <h3>Ce qui change</h3>
 * <p>Il melangeait quatre bibliotheques : `Label`, `Input`, `Textarea` et `Select` de
 * shadcn dans une coquille `Dialog` de shadcn, et ses messages d'erreur etaient des
 * `<p className="text-red-500">` poses A COTE du champ : une couleur sans variante sombre,
 * et une erreur qu'aucun lecteur d'ecran ne rattachait au champ fautif.</p>
 *
 * <p>Les deux listes de la periode etaient des `Select` qu'on deroulait : douze mois
 * passe encore, mais le champ statut et les annees suivaient le meme moule. Ce sont des
 * listes CHERCHABLES, comme partout ailleurs dans l'ERP.</p>
 */
export function EntreeCaisseForm({ defaultValues, onSubmit, soumission }: EntreeCaisseFormProps) {
  const now = new Date();
  const initialDate = defaultValues?.dateEntree
    ? parseDateEntree(defaultValues.dateEntree)
    : {
        month: String(now.getMonth() + 1).padStart(2, '0'),
        year: String(currentYear),
      };

  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [statut, setStatut] = useState(defaultValues?.paye ? 'paye' : 'non_paye');

  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<EntreeCaisseCreateDTO>({
    defaultValues: {
      commentaire: '',
      libelle: '',
      montant: 0,
      paye: false,
      ...defaultValues,
      dateEntree: buildDateEntree(initialDate.month, initialDate.year),
    },
    resolver: zodResolver(entreeCaisseSchema),
  });

  // La fenetre porte le bouton : on lui remet la soumission a chaque rendu, pour qu'elle
  // declenche toujours la validation de l'etat courant.
  soumission.current = handleSubmit(onSubmit);

  const handleStatutChange = (value: string) => {
    setStatut(value);
    setValue('paye', value === 'paye');
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setValue('dateEntree', buildDateEntree(month, selectedYear));
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setValue('dateEntree', buildDateEntree(selectedMonth, year));
  };

  return (
    <div className="flex flex-col gap-4">
      <Controller
        control={control}
        name="libelle"
        render={({ field }) => (
          <ChampTexte
            erreur={errors.libelle?.message}
            label="Libellé"
            onChange={field.onChange}
            placeholder="Libellé de l'entrée"
            valeur={field.value ?? ''}
          />
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <ChampListe
          label="Mois"
          onChange={handleMonthChange}
          options={MOIS}
          placeholder="Mois"
          valeur={selectedMonth}
        />
        <ChampListe
          erreur={errors.dateEntree?.message}
          label="Année"
          onChange={handleYearChange}
          options={ANNEES}
          placeholder="Année"
          valeur={selectedYear}
        />
      </div>

      <Controller
        control={control}
        name="montant"
        render={({ field }) => (
          <ChampMontant
            erreur={errors.montant?.message}
            label="Montant (FCFA)"
            onChange={(v) => field.onChange(Number.isNaN(v) ? 0 : v)}
            valeur={field.value}
          />
        )}
      />

      <div className="flex flex-col gap-1.5">
        <ChampListe
          label="Statut"
          onChange={handleStatutChange}
          options={STATUTS}
          placeholder="Statut"
          valeur={statut}
        />
        {/* `ChampListe` ne porte pas de texte d'aide : la consequence du statut se dit ici. */}
        <p className="text-xs text-muted">
          Une entrée non payée reste dans le CA mais n&apos;est pas comptée dans
          l&apos;encaissé.
        </p>
      </div>

      <Controller
        control={control}
        name="commentaire"
        render={({ field }) => (
          <ChampZoneTexte
            label="Commentaire"
            lignes={3}
            onChange={field.onChange}
            placeholder="Commentaire (optionnel)"
            valeur={field.value ?? ''}
          />
        )}
      />
    </div>
  );
}
