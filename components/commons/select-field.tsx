'use client';

import { useEffect, useState } from 'react';

import { ChampListe } from '@/components/commons/champs-formulaire';

interface Props {
  asDefaulValue?: boolean;
  label: string;
  livreur?: any;
  options?: { [k: string]: any; id?: string }[];
  selectValue?: string;
  setLivreur?: (livreur?: any) => void;
  setSelectValue?: (event?: any) => void;
  size?: 'lg' | 'md' | 'sm';
}

/**
 * Le choix d'un établissement dans une cellule de tableau.
 *
 * <h3>Ce qui change</h3>
 * <p>C'était un `Select` de la v2, non cherchable, sur la liste COMPLÈTE des partenaires :
 * pour réaffecter un livreur, il fallait dérouler plusieurs centaines d'entrées. Il passe
 * par le champ partagé, qui filtre à la frappe.</p>
 *
 * <p>Il portait aussi `label={''}` et `aria-labelledby=" "` — un libellé vide et une
 * référence vers une chaîne d'espace. Le champ n'avait donc AUCUN nom : au lecteur
 * d'écran, une liste déroulante muette au milieu d'une ligne de tableau.</p>
 *
 * <p>⚠ Il existe un second composant du même nom sous `commons/form/select-field`, avec
 * d'autres props. Les deux sont vivants et appelés depuis des écrans différents.</p>
 */
export function SelectField(props: Props) {
  const cleCourante =
    props.options?.find((o) => o[props.label] === props.selectValue)?.id ?? '';

  const [valeur, setValeur] = useState<string>(cleCourante);

  useEffect(() => {
    setValeur(cleCourante);
  }, [cleCourante]);

  return (
    <div className="max-w-xs">
      <ChampListe
        label="Établissement"
        onChange={(v) => {
          setValeur(v);
          props.setSelectValue?.(v);
          props.setLivreur?.(props.livreur);
        }}
        options={(props.options ?? []).map((o) => ({
          label: String(o[props.label] ?? ''),
          value: String(o.id ?? ''),
        }))}
        placeholder="Rechercher un établissement"
        valeur={valeur}
      />
    </div>
  );
}
