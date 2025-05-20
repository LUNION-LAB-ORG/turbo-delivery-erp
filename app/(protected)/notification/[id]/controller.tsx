'use client';

import { updateNotifcation } from '@/src/actions/notifcation.action';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useDetailNotificationController(id: string) {
  const { data } = useSession();
  const router = useRouter();
  const lireNotification = async () => {
    try {
      await updateNotifcation({
        utilisateurId: data ? data.user?.id : '',
        notificationId: id,
      });
    } catch (error) {
    } finally {
      router.refresh();
    }
  };

  useEffect(() => {
    lireNotification();
  }, [id]);
}
