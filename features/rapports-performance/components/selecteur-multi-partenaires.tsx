'use client';

import { Button, Checkbox, CheckboxGroup, Input, Popover, Separator } from '@heroui-v3/react';
import { ChevronDown, Store } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { RestaurantOption } from '@/features/restaurants';

interface SelecteurMultiPartenairesProps {
  options: RestaurantOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
}

/**
 * La selection MULTIPLE de partenaires du rapport de performance.
 *
 * <h3>Pourquoi un composant de plus</h3>
 * <p>`RestaurantSelect` est PARTAGE avec les recouvrements et l'encours. Le transformer en
 * multi-selection changerait la forme de sa valeur - une chaine devient un tableau - sur
 * des ecrans qui n'ont rien demande, et dont aucun n'a de mode multiple. Le modele suivi
 * ici est celui de `encours-store-filter.tsx`, deja ecrit pour exactement ce geste.</p>
 *
 * <p>La liste se cherche : soixante-sept etablissements sont definis en production, et la
 * seule facon d'en trouver un dans une colonne de cases a cocher est de la parcourir a
 * l'oeil. C'est la regle du depot pour tout ce qui se filtre.</p>
 */
export function SelecteurMultiPartenaires({
  isLoading = false,
  onChange,
  options,
  value,
}: SelecteurMultiPartenairesProps) {
  const [recherche, setRecherche] = useState('');

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase('fr-FR');
    if (!terme) return options;
    return options.filter((o) => o.label.toLocaleLowerCase('fr-FR').includes(terme));
  }, [options, recherche]);

  /*
   * « Tout » et « Aucun » agissent sur CE QUE LA LISTE MONTRE, pas sur le catalogue entier.
   * Avec une recherche en cours, un bouton qui cocherait les soixante-sept etablissements
   * ferait autre chose que ce qui est sous les yeux. « Aucun » retire symetriquement les
   * seuls visibles : une case cochee hors du filtre reste une intention de l'operateur.
   */
  const idsVisibles = visibles.map((o) => o.value);
  const toutCocher = () => onChange(Array.from(new Set([...value, ...idsVisibles])));
  const toutDecocher = () => onChange(value.filter((id) => !idsVisibles.includes(id)));

  /*
   * Le libelle du bouton dit le NOMBRE, et nomme le partenaire quand il n'y en a qu'un.
   * « 1 partenaire » obligerait a ouvrir le tiroir pour savoir lequel.
   */
  const nomUnique = value.length === 1 ? options.find((o) => o.value === value[0])?.label : undefined;
  const libelle =
    value.length === 0
      ? 'Aucun partenaire coché'
      : (nomUnique ?? `${value.length} partenaires`);

  return (
    /*
     * La recherche se vide a la FERMETURE. Sans cela, le tiroir se rouvre sur une liste
     * amputee par un terme saisi plus tot, sans rien qui dise pourquoi les autres
     * partenaires manquent. Les cases cochees, elles, sont conservees : react-aria
     * travaille sur le tableau controle, pas sur les enfants montes.
     */
    <Popover
      onOpenChange={(ouvert) => {
        if (!ouvert) setRecherche('');
      }}
    >
      <Button className="max-w-[260px]" isDisabled={isLoading} size="sm" variant="outline">
        <Store aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{isLoading ? 'Chargement…' : libelle}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </Button>
      <Popover.Content className="w-80">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">Partenaires</span>
          <div className="flex gap-1">
            <Button isDisabled={visibles.length === 0} onPress={toutCocher} size="sm" variant="ghost">
              Tout
            </Button>
            <Button isDisabled={visibles.length === 0} onPress={toutDecocher} size="sm" variant="ghost">
              Aucun
            </Button>
          </div>
        </div>

        <Input
          aria-label="Rechercher un partenaire"
          className="mt-2 w-full"
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher…"
          value={recherche}
        />

        <Separator className="my-2" />

        <div className="max-h-64 w-full overflow-y-auto">
          {visibles.length > 0 ? (
            <CheckboxGroup onChange={onChange} value={value}>
              {visibles.map((o) => (
                <Checkbox key={o.value} value={o.value}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    {o.label}
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </CheckboxGroup>
          ) : (
            <p className="text-sm text-muted">
              {options.length === 0 ? 'Aucun partenaire.' : 'Aucun partenaire ne correspond.'}
            </p>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}
