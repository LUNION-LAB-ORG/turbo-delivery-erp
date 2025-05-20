'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface ProvidersProps {
    children: React.ReactNode;
}

export default function TanStackProvider({ children }: ProvidersProps) {
    // On instancie le QueryClient une seule fois
    const [queryClient] = useState(() => new QueryClient());
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
