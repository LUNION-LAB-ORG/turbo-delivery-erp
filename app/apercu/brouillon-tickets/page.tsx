import { notFound } from 'next/navigation';

import ApercuBrouillonTickets from './contenu';

/** Banc du brouillon de saisie et du message de version périmée. Dev seulement. */
export default function PageApercuBrouillonTickets() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuBrouillonTickets />;
}
