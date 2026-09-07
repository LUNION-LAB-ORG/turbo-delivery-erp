import { notFound } from 'next/navigation';

import ApercuPaginationTickets from './contenu';

/** Banc de PAGINATION du tableau des tickets. N'existe qu'en développement. */
export default function PageApercuPaginationTickets() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuPaginationTickets />;
}
