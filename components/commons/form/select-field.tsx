'use client';

import { ChampListe } from '@/components/commons/champs-formulaire';

interface SelectFieldProps {
  className?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  optionLabel?: string;
  options: { [k: string]: any; id?: string }[];
  optionValue?: string;
  placeholder?: string;
  required?: boolean;
  setValue?: (value: any) => void;
  value?: any;
}

/**
 * Un choix dans une liste, dans un formulaire.
 *
 * <h3>Ce qui change</h3>
 * <p>Le `Select` ne recevait JAMAIS `selectedKeys` : il était entièrement non contrôlé, et
 * ne réaffichait donc pas ce qu'on venait d'y choisir. La valeur partait bien au parent
 * par `setValue`, mais le champ, lui, retombait sur son texte de substitution — on
 * rouvrait la liste pour vérifier ce qu'on avait sélectionné.</p>
 *
 * <p>Il n'était pas cherchable non plus, et portait `label={''}` : son nom accessible
 * venait d'un `aria-label` tandis que rien n'était affiché à l'écran. Chaque option
 * portait par ailleurs un `aria-placeholder="selectionnée une période"` — un attribut
 * sans effet sur une option, avec une faute, et le même sur toutes.</p>
 *
 * <p>⚠ Il existe un second composant du même nom sous `commons/select-field`, avec
 * d'autres props. Les deux sont vivants et appelés depuis des écrans différents.</p>
 */
export function SelectField(props: SelectFieldProps) {
  return (
    <div className={props.className ?? 'w-full max-w-lg'}>
      <ChampListe
        label={props.label}
        onChange={(v) => props.setValue?.(v)}
        options={props.options.map((item) => ({
          label: String(item[props.label] ?? ''),
          value: String(item.id ?? ''),
        }))}
        placeholder={props.placeholder ?? 'Rechercher'}
        valeur={props.value == null ? '' : String(props.value)}
      />
    </div>
  );
}
