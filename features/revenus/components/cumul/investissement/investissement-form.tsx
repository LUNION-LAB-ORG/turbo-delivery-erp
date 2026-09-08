'use client';

import { UseFormReturn } from 'react-hook-form';

import { ChampDate, ChampMontant, ChampTexte } from '@/components/commons/champs-formulaire';

interface InvestissementFormProps {
  form: UseFormReturn<any>;
}

/**
 * Les quatre champs d'un investissement, partages par la creation et la modification.
 *
 * <p>Le formulaire prend maintenant le `form` entier au lieu de `register` seul : les
 * champs partages du projet sont PILOTES (une valeur, un `onChange`) la ou `register`
 * pose un champ libre. Les deux seules fenetres qui rendent ce formulaire construisent
 * deja leur `useForm`, il n'y a pas d'autre appelant a suivre.</p>
 *
 * <p>Le `defaultValues` que prenait ce composant a disparu : il recopiait ce que les deux
 * appelants passaient DEJA a `useForm`, et seul celui de `useForm` etait lu par la
 * validation. Deux sources pour une meme valeur, dont une morte.</p>
 */
export function InvestissementForm({ form }: InvestissementFormProps) {
  const {
    formState: { errors },
    setValue,
    watch,
  } = form;

  const erreur = (champ: string) => {
    const message = errors[champ]?.message;
    return message ? String(message) : undefined;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChampTexte
        erreur={erreur('nomInvestisseur')}
        label="Nom de l'investisseur"
        onChange={(v) => setValue('nomInvestisseur', v, { shouldValidate: true })}
        placeholder="Ex: Jean Dupont"
        valeur={watch('nomInvestisseur') ?? ''}
      />

      {/*
       * « FCFA » etait un `<span>` pose en position absolue PAR-DESSUS le champ : des que
       * le montant depassait six chiffres, le nombre passait dessous et devenait illisible
       * au moment precis ou il compte le plus. La devise se lit maintenant sous le champ.
       */}
      <ChampMontant
        aide="En FCFA"
        erreur={erreur('montant')}
        label="Montant de l'investissement"
        onChange={(v) => setValue('montant', Number.isNaN(v) ? 0 : v, { shouldValidate: true })}
        valeur={watch('montant')}
      />

      <ChampDate
        erreur={erreur('dateInvestissement')}
        label="Date de l'investissement"
        onChange={(v) => setValue('dateInvestissement', v, { shouldValidate: true })}
        valeur={watch('dateInvestissement')}
      />

      <ChampDate
        erreur={erreur('deadline')}
        label="Échéance"
        onChange={(v) => setValue('deadline', v, { shouldValidate: true })}
        valeur={watch('deadline')}
      />
    </div>
  );
}
