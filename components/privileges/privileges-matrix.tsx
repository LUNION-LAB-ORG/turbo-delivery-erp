'use client';

import { Table } from '@heroui-v3/react';
import { Check, Minus, X } from 'lucide-react';
import React from 'react';

import menuData, { IMenuData } from '@/config/menu-data';
import { APP_ROLES, AppRole, defineAbilityFor } from '@/lib/casl/ability';

interface FlatRow {
  can?: IMenuData['can'];
  isParent: boolean;
  key: string;
  title: string;
}

/** Aplatit l'arbre du menu : parents (groupe) puis leurs enfants indentés. */
function flatten(items: IMenuData[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const it of items) {
    if (it.children?.length) {
      rows.push({ can: it.can, isParent: true, key: it.title, title: it.title });
      for (const c of it.children) {
        rows.push({ can: c.can, isParent: false, key: `${it.title}>${c.title}`, title: c.title });
      }
    } else {
      rows.push({ can: it.can, isParent: false, key: it.title, title: it.title });
    }
  }
  return rows;
}

// Abilities pré-calculées une fois par rôle (fonctions pures).
const ABILITIES: Record<string, ReturnType<typeof defineAbilityFor>> = Object.fromEntries(
  APP_ROLES.map((r) => [r, defineAbilityFor(r as AppRole)]),
);

// Colonnes : "Menu / Page" + un rôle par colonne. Un seul tableau mappé
// (pattern React-Aria du codebase).
const COLONNES = [
  { key: '__item', label: 'Menu / Page' },
  ...APP_ROLES.map((r) => ({ key: r, label: r })),
];

/**
 * La marque d'une case : autorisé, refusé, ou sans règle.
 *
 * <h3>Ce qui change</h3>
 * <p>« Refusé » était un point médian `·` et « aucune règle » un tiret `—`, tous deux en
 * `text-default-200` — un gris presque blanc. Sur une matrice qui sert à AUDITER qui peut
 * faire quoi, les deux cas se ressemblaient à s'y méprendre et se distinguaient à peine du
 * fond. « Cette page n'a pas de règle » et « ce rôle n'y a pas droit » ne disent pourtant
 * pas la même chose : la première est une lacune de configuration.</p>
 *
 * <p>Aucune des trois marques n'avait de texte : au lecteur d'écran, la matrice entière
 * était une grille de cellules vides. Chacune porte maintenant son sens.</p>
 */
function Marque({ etat, role, titre }: { etat: boolean | null; role: string; titre: string }) {
  if (etat === null) {
    return (
      <span className="inline-flex" title={`${titre} : aucune règle définie`}>
        <Minus aria-hidden="true" className="size-4 text-muted/50" />
        <span className="sr-only">{`${titre} — ${role} : aucune règle définie`}</span>
      </span>
    );
  }
  if (etat) {
    return (
      <span className="inline-flex" title={`${titre} : autorisé`}>
        <Check aria-hidden="true" className="size-4 text-success" />
        <span className="sr-only">{`${titre} — ${role} : autorisé`}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex" title={`${titre} : refusé`}>
      {/* Un refus est la regle NORMALE d'une matrice de droits, pas une anomalie :
          il se lit, il ne s'alarme pas. */}
      <X aria-hidden="true" className="size-4 text-muted" />
      <span className="sr-only">{`${titre} — ${role} : refusé`}</span>
    </span>
  );
}

export function PrivilegesMatrix() {
  const rows = React.useMemo(() => flatten(menuData), []);

  return (
    <Table>
      <Table.ScrollContainer className="rounded-xl border border-separator">
        <Table.Content aria-label="Matrice des privilèges par rôle">
          <Table.Header>
            {COLONNES.map((c, i) => (
              <Table.Column
                className={
                  c.key === '__item'
                    ? 'sticky left-0 z-10 bg-surface-secondary text-[10px] font-semibold tracking-wide uppercase'
                    : 'text-center text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase'
                }
                id={c.key}
                isRowHeader={i === 0}
                key={c.key}
              >
                {c.label}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row
                className={row.isParent ? 'bg-surface-secondary' : undefined}
                id={row.key}
                key={row.key}
              >
                {COLONNES.map((c) => {
                  if (c.key === '__item') {
                    return (
                      <Table.Cell className="sticky left-0 z-10 bg-inherit" key={c.key}>
                        {row.isParent ? (
                          <span className="font-semibold text-foreground">{row.title}</span>
                        ) : (
                          <span className="pl-4 text-muted">{row.title}</span>
                        )}
                      </Table.Cell>
                    );
                  }
                  /*
                   * UN GROUPE N'EST PAS UN SUJET DE DROIT.
                   *
                   * <p>La ligne d'un groupe portait la meme marque « aucune regle definie »
                   * qu'une page reellement non configuree, et le sens de cette marque est
                   * ecrit plus haut : une LACUNE de configuration. Le regroupement des
                   * menus a fait passer les groupes de six a huit et leur a retire leur
                   * regle, puisqu'ils n'en ont pas besoin : leurs enfants portent les
                   * leurs. La matrice annoncait donc huit lacunes inventees, sur l'ecran
                   * meme qui sert a auditer qui peut faire quoi.</p>
                   *
                   * <p>Une ligne de groupe sans regle est un INTITULE. Ses cases restent
                   * vides, et le lecteur d'ecran l'entend comme tel.</p>
                   */
                  if (row.isParent && !row.can) {
                    return (
                      <Table.Cell className="text-center" key={c.key}>
                        <span className="sr-only">{`${row.title} : intitulé de groupe`}</span>
                      </Table.Cell>
                    );
                  }
                  const allowed = row.can
                    ? ABILITIES[c.key].can(row.can.action, row.can.subject)
                    : null;
                  return (
                    <Table.Cell className="text-center" key={c.key}>
                      <Marque etat={allowed} role={c.label} titre={row.title} />
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
