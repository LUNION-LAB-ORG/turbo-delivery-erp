'use client';

import {
  Button,
  Calendar,
  ComboBox,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Input,
  InputGroup,
  Label,
  ListBox,
  NumberField,
  Tag,
  TagGroup,
  TextArea,
  TextField,
} from '@heroui-v3/react';
import { parseDate, type CalendarDate, type DateValue } from '@internationalized/date';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import React from 'react';

/**
 * Les champs de formulaire de l'ERP.
 *
 * <h3>Ce qui change</h3>
 * <p>Chaque fenêtre du projet recomposait à la main la même triade : un `<Label>` de
 * shadcn, un `Input` de HeroUI v2 et un `<small className="text-red-500">` pour l'erreur.
 * Trois bibliothèques pour un champ, et une erreur peinte dans une palette sans variante
 * sombre, à côté d'un champ dont l'état d'erreur venait, lui, du thème.</p>
 *
 * <p>Ici l'erreur est portée par le champ lui-même : `isInvalid` colore la bordure et
 * `FieldError` place le message, tous deux issus du thème et annoncés par les lecteurs
 * d'écran via `aria-describedby` — ce que le `<small>` ne faisait pas.</p>
 *
 * <p>Attention aux deux `onChange` de la v3, qui ne se ressemblent pas : `TextField`
 * passe la VALEUR, `TextArea` passe un ÉVÉNEMENT DOM.</p>
 */

export function ChampTexte({
  aide,
  erreur,
  label,
  onChange,
  placeholder,
  type = 'text',
  valeur,
}: {
  aide?: string;
  erreur?: string;
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: 'date' | 'email' | 'tel' | 'text';
  valeur: string;
}) {
  return (
    <TextField isInvalid={Boolean(erreur)} onChange={onChange} value={valeur ?? ''}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input placeholder={placeholder} type={type} />
      </InputGroup>
      {aide && !erreur && <Description>{aide}</Description>}
      {erreur && <FieldError>{erreur}</FieldError>}
    </TextField>
  );
}

export function ChampMontant({
  aide,
  erreur,
  label,
  max,
  onChange,
  valeur,
}: {
  aide?: string;
  erreur?: string;
  label: string;
  max?: number;
  onChange: (v: number) => void;
  valeur: number | undefined;
}) {
  return (
    <NumberField
      formatOptions={{ maximumFractionDigits: 0 }}
      isInvalid={Boolean(erreur)}
      maxValue={max}
      minValue={0}
      onChange={onChange}
      value={valeur ?? Number.NaN}
    >
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {aide && !erreur && <Description>{aide}</Description>}
      {erreur && <FieldError>{erreur}</FieldError>}
    </NumberField>
  );
}

export function ChampZoneTexte({
  erreur,
  label,
  lignes = 3,
  onChange,
  placeholder,
  valeur,
}: {
  erreur?: string;
  label: string;
  lignes?: number;
  onChange: (v: string) => void;
  placeholder?: string;
  valeur: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {/*
       * `TextArea` n'est PAS compose : il ne prend pas de `label`, et son `onChange`
       * recoit un EVENEMENT DOM la ou `TextField` passe la valeur. Un `onValueChange`
       * herite de la v2 serait ignore en silence et le champ ne remonterait rien.
       */}
      <TextArea
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={lignes}
        value={valeur ?? ''}
      />
      {erreur && <span className="text-xs text-danger">{erreur}</span>}
    </div>
  );
}

/**
 * Un mot de passe, avec son bouton de relecture.
 *
 * <p>Deux usages coexistent. La plupart des écrans le pilotent (`valeur` + `onChange`).
 * Le changement de mot de passe obligatoire, lui, poste vers une action serveur qui lit
 * `FormData` : là, le champ reste libre et c'est `name` qui porte sa valeur.</p>
 */
export function ChampMotDePasse({
  autoComplete,
  erreur,
  estRequis,
  label,
  name,
  onChange,
  placeholder = '••••••••',
  valeur,
}: {
  /** Sans lui, aucun gestionnaire de mots de passe ne remplit ni ne propose d'enregistrer. */
  autoComplete?: 'current-password' | 'new-password';
  erreur?: string;
  estRequis?: boolean;
  label: string;
  /** Le champ est alors libre : sa valeur part au formulaire sous ce nom. */
  name?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  valeur?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  // `value` n'est passé que s'il y en a un : le poser à `''` rendrait contrôlé un champ
  // que l'action serveur veut libre, et React se plaindrait du changement de régime.
  const pilotage = valeur === undefined ? {} : { onChange, value: valeur };

  return (
    <TextField
      isInvalid={Boolean(erreur)}
      isRequired={estRequis}
      name={name}
      type={visible ? 'text' : 'password'}
      {...pilotage}
    >
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input autoComplete={autoComplete} placeholder={placeholder} />
        {/*
         * C'etait un `<button type="button">` nu place en `endContent` : sans etat de
         * focus, sans nom accessible, et sans dire s'il montre ou masque. Son nom reprend
         * le libelle du champ : trois mots de passe sur un meme ecran donnaient sinon
         * trois boutons annonces a l'identique.
         */}
        <InputGroup.Suffix>
          <Button
            aria-label={`${visible ? 'Masquer' : 'Afficher'} ${label.toLowerCase()}`}
            isIconOnly
            onPress={() => setVisible((v) => !v)}
            size="sm"
            variant="ghost"
          >
            {visible ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
      {erreur && <FieldError>{erreur}</FieldError>}
    </TextField>
  );
}

/**
 * Une date, au format `yyyy-MM-dd`.
 *
 * <p>Le `DatePicker` de la v3 se compose en une douzaine de balises. Chaque écran qui en
 * voulait un les recopiait, ce qui multiplie les occasions d'en oublier une — le bouton de
 * navigation du mois, par exemple, dont l'absence ne casse rien mais empêche de reculer.</p>
 *
 * <p>La valeur entre et sort en texte : c'est la forme que le serveur attend, et elle se
 * compare telle quelle. Une chaîne vide ou illisible vaut « pas de date » plutôt que de
 * faire tomber l'écran.</p>
 */
export function ChampDate({
  erreur,
  label,
  onChange,
  valeur,
}: {
  erreur?: string;
  label: string;
  onChange: (v: string) => void;
  valeur?: string;
}) {
  let calendaire: DateValue | null = null;
  try {
    calendaire = valeur ? parseDate(valeur.slice(0, 10)) : null;
  } catch {
    calendaire = null;
  }

  return (
    <DatePicker
      isInvalid={Boolean(erreur)}
      onChange={(d: DateValue | null) => onChange(d ? d.toString() : '')}
      value={calendaire}
    >
      <Label>{label}</Label>
      <DateField.Group>
        <DateField.Input>
          {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
            <DateField.Segment segment={segment} />
          )}
        </DateField.Input>
        <DatePicker.Trigger>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
      </DateField.Group>
      <DatePicker.Popover>
        <Calendar>
          <Calendar.Header>
            <Calendar.NavButton slot="previous">
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Calendar.NavButton>
            <Calendar.Heading />
            <Calendar.NavButton slot="next">
              <ChevronRight aria-hidden="true" className="size-4" />
            </Calendar.NavButton>
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(jour: string) => <Calendar.HeaderCell>{jour}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date: CalendarDate) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
      {erreur && <FieldError>{erreur}</FieldError>}
    </DatePicker>
  );
}

export function ChampListe({
  erreur,
  label,
  onChange,
  options,
  placeholder,
  valeur,
}: {
  erreur?: string;
  label: string;
  onChange: (v: string) => void;
  options: readonly { label: string; value: string }[];
  placeholder?: string;
  valeur: string;
}) {
  return (
    <ComboBox
      isInvalid={Boolean(erreur)}
      onSelectionChange={(k) => onChange(k == null ? '' : String(k))}
      selectedKey={valeur || null}
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      {erreur && <FieldError>{erreur}</FieldError>}
      <ComboBox.Popover>
        <ListBox items={options.map((o) => ({ id: o.value, label: o.label }))}>
          {(o: { id: string; label: string }) => (
            <ListBox.Item id={o.id} textValue={o.label}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

/**
 * Un choix MULTIPLE dans une liste longue : on cherche, on ajoute, on retire.
 *
 * <p>La v2 offrait un `Select selectionMode="multiple"` qui ne se cherchait pas. Sur les
 * quelques listes concernées — les partenaires desservis dans un programme, par exemple —
 * cela voulait dire dérouler plusieurs centaines de restaurants pour en cocher trois.</p>
 *
 * <p>Le `ComboBox` sert ici à AJOUTER : il se vide après chaque choix, et n'offre plus que
 * ce qui n'est pas déjà retenu. Les choix faits sont des étiquettes, chacune avec son
 * bouton de retrait — c'est aussi la seule façon de voir d'un coup d'œil ce qui est
 * sélectionné, là où le `Select` n'en montrait qu'un décompte.</p>
 */
export function ChampListeMultiple({
  aide,
  label,
  onChange,
  options,
  placeholder,
  valeurs,
}: {
  aide?: string;
  label: string;
  onChange: (v: string[]) => void;
  options: readonly { label: string; value: string }[];
  placeholder?: string;
  valeurs: string[];
}) {
  const libelle = React.useCallback(
    (v: string) => options.find((o) => o.value === v)?.label ?? v,
    [options],
  );
  const restantes = options.filter((o) => !valeurs.includes(o.value));

  return (
    <div className="flex flex-col gap-2">
      <ComboBox
        // La cle force le remontage : sans elle, le ComboBox garde le texte tape et le
        // dernier choix reste affiche dans le champ apres avoir ete transforme en etiquette.
        key={valeurs.length}
        onSelectionChange={(k) => k != null && onChange([...valeurs, String(k)])}
        selectedKey={null}
      >
        <Label>{label}</Label>
        <ComboBox.InputGroup>
          <Input placeholder={placeholder} />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        {aide && <Description>{aide}</Description>}
        <ComboBox.Popover>
          <ListBox items={restantes.map((o) => ({ id: o.value, label: o.label }))}>
            {(o: { id: string; label: string }) => (
              <ListBox.Item id={o.id} textValue={o.label}>
                {o.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      {valeurs.length > 0 && (
        <TagGroup
          aria-label={label}
          onRemove={(cles) => onChange(valeurs.filter((v) => !cles.has(v)))}
          size="sm"
        >
          <TagGroup.List items={valeurs.map((v) => ({ id: v, label: libelle(v) }))}>
            {(t: { id: string; label: string }) => (
              <Tag id={t.id} textValue={t.label}>
                {t.label}
                <Tag.RemoveButton />
              </Tag>
            )}
          </TagGroup.List>
        </TagGroup>
      )}
    </div>
  );
}

/** Un champ dont le contrôle est fourni par l'appelant (liste d'employés, par exemple). */
export function ChampEnveloppe({
  children,
  erreur,
  label,
}: {
  children: React.ReactNode;
  erreur?: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {erreur && <span className="text-xs text-danger">{erreur}</span>}
    </div>
  );
}
