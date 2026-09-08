'use client';

import { Separator } from '@heroui-v3/react';
import React from 'react';

import UserProfile from '@/components/dashboard/settings/profile/profile';
import type { User } from '@/types/models';

/**
 * Banc de la page Parametres.
 *
 * <p>La barre du haut n'appartient PAS a l'ecran. Elle sert a le regarder dans les
 * etats qu'on oublie : le role qui n'a pas droit au code de securite (la page se
 * reduit alors au bandeau d'identite), et surtout le cas ou AUCUN code n'est encore
 * defini, qui est celui que l'ecran ne savait pas dire.</p>
 */

const ROLES = ['DG', 'DGA', 'COMPTABLE'] as const;
const ETATS = ['inconnu', 'non defini', 'defini'] as const;

function profilExemple(role: string, etat: (typeof ETATS)[number]): User {
  return {
    attemptLogin: 0,
    changePassword: true,
    dateCreation: '2025-01-12T09:30:00Z',
    dateEdition: '2026-09-01T11:00:00Z',
    dateOfInactivity: '',
    deleted: false,
    email: 'anderson.kouadio@turbodeliveryapp.com',
    id: 'apercu',
    image: '',
    nom: 'KOUADIO',
    passwordExpired: '',
    prenoms: 'Anderson',
    role: { id: 'r1', libelle: role } as User['role'],
    status: 1,
    username: 'admin',
    ...(etat === 'inconnu' ? {} : { codeSecuriteDefini: etat === 'defini' }),
  } as User;
}

export default function ApercuParametres() {
  const [sombre, setSombre] = React.useState(false);
  const [role, setRole] = React.useState<string>('DG');
  const [etat, setEtat] = React.useState<(typeof ETATS)[number]>('inconnu');

  /*
   * Le theme de la v3 se lit sur <html> : le poser sur un div interieur laisse les
   * jetons de couleur au clair et le banc ment sur le rendu sombre.
   */
  React.useEffect(() => {
    const racine = document.documentElement;
    racine.classList.toggle('dark', sombre);
    return () => racine.classList.remove('dark');
  }, [sombre]);

  const bouton = (actif: boolean) =>
    [
      'rounded-md px-2.5 py-1.5 text-xs transition-colors',
      actif
        ? 'bg-foreground text-background'
        : 'text-muted hover:bg-surface-secondary hover:text-foreground',
    ].join(' ');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-separator bg-surface px-4 py-2.5">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">Aperçu</span>
        <Separator className="mx-1 h-5" orientation="vertical" />
        {ROLES.map((r) => (
          <button className={bouton(r === role)} key={r} onClick={() => setRole(r)} type="button">
            {r}
          </button>
        ))}
        <Separator className="mx-1 h-5" orientation="vertical" />
        {ETATS.map((e) => (
          <button className={bouton(e === etat)} key={e} onClick={() => setEtat(e)} type="button">
            code {e}
          </button>
        ))}
        <Separator className="mx-1 h-5" orientation="vertical" />
        <button
          className="rounded-md px-2.5 py-1.5 text-xs text-muted hover:bg-surface-secondary hover:text-foreground"
          onClick={() => setSombre((v) => !v)}
          type="button"
        >
          {sombre ? 'sombre' : 'clair'}
        </button>
      </header>

      {/* L'ECRAN COMMENCE ICI. Le `p-6` reproduit celui de la coquille ERP. */}
      <main className="p-6">
        <UserProfile key={`${role}-${etat}`} user={profilExemple(role, etat)} />
      </main>
    </div>
  );
}
