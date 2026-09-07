import { notFound } from 'next/navigation';

import ApercuSequenceTickets from './contenu';

/** Banc de SEQUENCE d'etats du tableau des tickets. N'existe qu'en developpement. */
export default function PageApercuSequenceTickets() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <ApercuSequenceTickets />;
}
