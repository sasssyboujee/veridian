import { http, createConfig } from 'wagmi';
import { foundry } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

export const uzhEth = defineChain({
  id: 70207,
  name: 'UZH_ETH_PoS',
  nativeCurrency: { name: 'UZHETHs', symbol: 'UZHETHs', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || ''] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.uzheths.ifi.uzh.ch' },
  },
});

export const config = createConfig({
  chains: [foundry, uzhEth],
  connectors: [injected()],
  transports: {
    [foundry.id]: http(),
    [uzhEth.id]: http(),
  },
});
