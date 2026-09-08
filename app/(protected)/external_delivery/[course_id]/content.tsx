'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { CourseExterneDetail, LivreurDisponible } from '@/types/models';
import { CorpsCourse, GestesCourse, IdentiteCourse } from './corps-course';

/**
 * Le detail d'une course, en PAGE.
 *
 * <p>La forme retenue pour la consultation courante est le tiroir (`tiroir-course.tsx`),
 * qui garde la liste et sa veille derriere lui. Cette page reste pour l'acces DIRECT par
 * URL : un lien colle dans une conversation, un second onglet ouvert a cote du premier.
 * Elle rend le MEME corps que le tiroir, il ne peut donc pas y avoir deux verites.</p>
 *
 * <p>Ce qui la distingue : elle a la largeur du poste, elle range donc le trajet et
 * l'argent cote a cote des `md` (768). L'ancienne grille ouvrait en `lg` (1024) sur une
 * fenetre qui fait 1000 px : elle etait toujours en une colonne, et le total comme le
 * telephone du livreur tombaient sous la pliure.</p>
 */
export default function Content({
  course,
  delivers,
}: {
  course: CourseExterneDetail;
  delivers: LivreurDisponible[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <Link
        className="flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        href="/external_delivery"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour aux courses
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {/* Le titre etait en `text-primary`, soit le rouge de marque. Il est reserve
              au geste : ici c'est le bouton d'assignation qui le porte. */}
          <h1 className="text-2xl font-bold text-foreground">
            Course <span className="font-mono">{course.code}</span>
          </h1>
          <IdentiteCourse course={course} />
        </div>
        <GestesCourse course={course} delivers={delivers} />
      </div>

      <CorpsCourse course={course} disposition="page" />
    </div>
  );
}
