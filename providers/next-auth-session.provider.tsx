'use client';

import { SessionProvider } from 'next-auth/react';
import { I18nProvider } from '@react-aria/i18n';
import { Session } from 'next-auth';

const NextAuthSessionProvider = ({ children }: { children: React.ReactNode }) => {
    return <SessionProvider>{children}</SessionProvider>;
};

export default NextAuthSessionProvider;
