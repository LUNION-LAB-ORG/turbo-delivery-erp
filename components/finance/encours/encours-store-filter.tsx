'use client';

import { Button, Checkbox, CheckboxGroup, Input, Popover, Separator } from '@heroui-v3/react';
import { ChevronDown, Store } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useEncoursStoresQuery } from '@/features/encours';

/**
 * Filtre « Points de vente » (§4) : multi-selection des points de vente d'UN partenaire,
 * boutons Tout / Aucun. Desactive tant qu'aucun partenaire n'est selectionne.
 * value = [] signifie « tous les points de vente ».
 *
 * <p>La liste se cherche : un groupe de restauration en compte parfois trente, et la
 * seule facon d'en trouver un etait de faire defiler une colonne de cases a cocher.
 * C'est la regle du projet pour tout ce qui se filtre.</p>
 */
export function EncoursStoreFilter({
  onChange,
  partenaire,
  value,
}: {
  onChange: (ids: string[]) => void;
  partenaire: string;
  value: string[];
}) {
  const enabled = Boolean(partenaire);
  const { data: stores } = useEncoursStoresQuery(partenaire);
  const options = useMemo(() => stores ?? [], [stores]);
  const [recherche, setRecherche] = useState('');

  const visibles = useMemo(() => {
    const terme = recherche.trim().toLocaleLowerCase('fr-FR');
    if (!terme) return options;
    return options.filter((o) => o.nom.toLocaleLowerCase('fr-FR').includes(terme));
  }, [options, recherche]);

  /*
   * « Tout » et « Aucun » agissent sur CE QUE LA LISTE MONTRE.
   *
   * <p>« Tout » cochait TOUS les identifiants : avec une recherche en cours, le bouton faisait donc
   * autre chose que ce qui etait sous les yeux. Il ajoute desormais les points de vente
   * visibles a la selection, sans decocher ceux que la recherche masque - une case cochee
   * hors filtre reste une intention de l'operateur. « Aucun » retire symetriquement les
   * seuls visibles ; sans recherche, cela revient a la liste vide, c'est-a-dire « tous les
   * points de vente » au sens de ce filtre.</p>
   */
  const idsVisibles = visibles.map((o) => o.id);
  const toutCocher = () => onChange(Array.from(new Set([...value, ...idsVisibles])));
  const toutDecocher = () => onChange(value.filter((id) => !idsVisibles.includes(id)));

  if (!enabled) {
    return (
      <Button
        aria-label="Points de vente : choisir d'abord un partenaire"
        isDisabled
        size="sm"
        variant="outline"
      >
        <Store aria-hidden="true" className="size-4" />
        Points de vente
      </Button>
    );
  }

  const label =
    value.length === 0
      ? 'Tous les points de vente'
      : `${value.length} point${value.length > 1 ? 's' : ''} de vente`;

  return (
    /*
     * La recherche se vide a la FERMETURE. Elle survivait au popover : on le rouvrait sur
     * une liste amputee par un terme saisi plus tot, sans rien qui dise pourquoi les
     * autres points de vente manquaient. Les cases cochees, elles, sont conservees -
     * react-aria travaille sur le tableau controle, pas sur les enfants montes.
     */
    <Popover
      onOpenChange={(ouvert) => {
        if (!ouvert) setRecherche('');
      }}
    >
      <Button className="max-w-[220px]" size="sm" variant="outline">
        <Store aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
      </Button>
      <Popover.Content className="w-72">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">Points de vente</span>
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
          aria-label="Rechercher un point de vente"
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
                <Checkbox key={o.id} value={o.id}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    {o.nom}
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </CheckboxGroup>
          ) : (
            <p className="text-sm text-muted">
              {options.length === 0 ? 'Aucun point de vente.' : 'Aucun point de vente ne correspond.'}
            </p>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}
