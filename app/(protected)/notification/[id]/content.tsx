'use client';

import { Card } from '@heroui-v3/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import moment from 'moment';
import { useParams } from 'next/navigation';

import { CardHeader } from '@/components/commons/card-header';
import { LienBouton } from '@/components/commons/LienBouton';
import { PageWrapper } from '@/components/commons/page-wrapper';
import { NotificationDetailsVM } from '@/types/notifcation.model';

import { useDetailNotificationController } from './controller';

interface DetailNotificationProps {
    detailNotification: NotificationDetailsVM;
}

/**
 * Le detail d'une notification.
 *
 * <h3>Ce qui change</h3>
 * <p>La `Card` venait de shadcn, quand la LISTE des notifications, juste a cote, utilise
 * celle de la v3. Deux cartes du meme objet qui ne se ressemblent pas d'un ecran a
 * l'autre, c'est exactement ce que la suppression des doublons de bibliotheques doit
 * faire disparaitre.</p>
 *
 * <p>Le retour etait un `&lt;Link&gt;` peint en `text-blue-500` : du bleu de palette, sans
 * variante sombre, sur un ecran dont tout le reste vient du theme. Les ruptures de
 * disposition etaient declarees en `lg:` (1024 px), un seuil que la fenetre de l'operateur
 * (environ 1000 px) n'atteint jamais : la disposition large n'etait jamais servie.</p>
 *
 * <p>Le lien vers l'objet concerne (`lien`) existait dans la donnee et n'etait affiche que
 * sur la LISTE : ouvrir le detail d'une notification de ticket faisait donc perdre
 * l'acces au ticket. Il est ici.</p>
 *
 * <p>Le titre annoncait « Detail des notifications », au pluriel, sur une page qui n'en
 * montre qu'UNE.</p>
 */
export function DetailNotification({ detailNotification }: DetailNotificationProps) {
    const params = useParams();
    useDetailNotificationController((params.id as string) ?? '');

    const recueLe = detailNotification.createdAt
        ? moment(detailNotification.createdAt).format('DD/MM/YYYY HH:mm:ss')
        : null;

    return (
        <PageWrapper>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <CardHeader title="Détail de la notification" />
                <LienBouton href="/notification" taille="sm" variante="ghost">
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Retour
                </LienBouton>
            </div>

            <Card>
                <Card.Header>
                    <p className="text-xs font-medium text-muted">Objet</p>
                    <Card.Title>{detailNotification.titre}</Card.Title>
                    {/* La date etait un `<i>` GRAS colle en bas a droite de la carte. Une
                        heure de reception se lit avec ce qu'elle date, et se compare d'une
                        notification a l'autre : chasse tabulaire. */}
                    {recueLe && (
                        <Card.Description className="tabular-nums">Reçue le {recueLe}</Card.Description>
                    )}
                </Card.Header>
                <Card.Content>
                    {/* `whitespace-pre-line` : les messages du backend portent leurs propres
                        retours a la ligne, qui etaient jusqu'ici ecrases en un seul bloc. */}
                    {detailNotification.message ? (
                        <p className="whitespace-pre-line text-sm text-foreground">
                            {detailNotification.message}
                        </p>
                    ) : (
                        <p className="text-sm text-muted">Cette notification n&apos;a pas de message.</p>
                    )}
                </Card.Content>
                {detailNotification.lien && (
                    <Card.Footer>
                        <LienBouton href={detailNotification.lien} taille="sm" variante="outline">
                            Ouvrir l&apos;élément concerné
                            <ExternalLink aria-hidden="true" className="size-3" />
                        </LienBouton>
                    </Card.Footer>
                )}
            </Card>
        </PageWrapper>
    );
}
