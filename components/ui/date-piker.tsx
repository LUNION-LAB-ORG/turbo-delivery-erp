'use client';

import { DateField, DateRangePicker, Label, RangeCalendar } from '@heroui-v3/react';
import { getLocalTimeZone, today } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

const ZONE = getLocalTimeZone();

/**
 * Le choix d'une période.
 *
 * <h3>Ce qui change</h3>
 * <p>Ce composant n'avait plus de CALENDRIER : le `DatePicker` était entièrement en
 * commentaire au milieu du panneau. Ce qui restait était un bouton qui ouvrait un cadre
 * bordé de `border-red-300`, titré « Dates enregistrées » en `text-red-500`, contenant un
 * bouton « Afficher toutes les dates » sans gestionnaire, un « Annuler » qui remettait la
 * plage à vide, et un « Appliquer » rouge qui ne faisait rien non plus. Un sélecteur de
 * période où l'on ne pouvait choisir aucune date.</p>
 *
 * <p>Il utilise maintenant le `DateRangePicker` de la bibliothèque, celui-là même qui sert
 * déjà à la facturation par plage de dates. Il expose la plage retenue à l'appelant, ce
 * que l'ancien ne faisait pas.</p>
 */
export function DatePickers({
  onChange,
  value,
}: {
  onChange?: (plage: { end: DateValue; start: DateValue } | null) => void;
  value?: { end: DateValue; start: DateValue } | null;
}) {
  const [interne, setInterne] = useState<{ end: DateValue; start: DateValue } | null>(null);
  const plage = value !== undefined ? value : interne;

  return (
    <DateRangePicker
      className="max-w-md"
      maxValue={today(ZONE)}
      onChange={(v) => {
        setInterne(v);
        onChange?.(v);
      }}
      value={plage}
    >
      <Label>Période</Label>
      <DateField.Group>
        <DateField.Input slot="start">
          {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
            <DateField.Segment segment={segment} />
          )}
        </DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot="end">
          {(segment: React.ComponentProps<typeof DateField.Segment>['segment']) => (
            <DateField.Segment segment={segment} />
          )}
        </DateField.Input>
        <DateRangePicker.Trigger>
          <CalendarDays aria-hidden="true" className="size-4" />
        </DateRangePicker.Trigger>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar visibleDuration={{ months: 2 }}>
          <RangeCalendar.Header>
            <RangeCalendar.NavButton slot="previous">
              <ChevronLeft aria-hidden="true" className="size-4" />
            </RangeCalendar.NavButton>
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="next">
              <ChevronRight aria-hidden="true" className="size-4" />
            </RangeCalendar.NavButton>
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(jour) => <RangeCalendar.HeaderCell>{jour}</RangeCalendar.HeaderCell>}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}
