'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { Button } from './ui/Button';

export function WalletConnect() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Find the injected connector (typically MetaMask)
  const injectedConnector = connectors.find((c) => c.id === 'injected') || connectors[0];

  const handleConnect = () => {
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    } else {
      alert('MetaMask or another injected wallet was not found. Please install a Web3 wallet extension.');
    }
  };

  if (!isMounted) {
    return <Button disabled>Loading...</Button>;
  }

  if (isConnected && address) {
    const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const isWrongNetwork = chain?.id !== 31337; // Foundry Localhost Chain ID

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isWrongNetwork && (
          <Button 
            onClick={() => switchChain({ chainId: 31337 })}
            style={{ 
              backgroundColor: 'rgba(207, 32, 47, 0.1)', 
              color: 'var(--color-error)',
              border: '1px solid var(--color-error)'
            }}
          >
            Switch to Localhost
          </Button>
        )}
        <span 
          className="body-tabular"
          style={{ 
            color: 'var(--color-ink)', 
            fontSize: '14px', 
            fontWeight: 500, 
            backgroundColor: 'var(--color-canvas-soft)', 
            padding: '6px 12px', 
            borderRadius: '12px',
            border: '1px solid var(--color-border)' 
          }}
        >
          {formattedAddress}
        </span>
        <Button variant="secondary" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isPending}
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
