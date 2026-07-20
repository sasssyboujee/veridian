'use client';

import { ReactNode, useEffect } from 'react';
import { WagmiProvider, useReconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '../lib/wagmi';

const queryClient = new QueryClient();

function Reconnecter({ children }: { children: ReactNode }) {
  const { reconnect } = useReconnect();

  useEffect(() => {
    reconnect();
  }, [reconnect]);

  return <>{children}</>;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Reconnecter>
          {children}
        </Reconnecter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
