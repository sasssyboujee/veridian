import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { RWAFactory_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { OnChainAsset } from '@/types/asset';

// Default demo assets visible to all users, even without a wallet connection.
// These represent assets already deployed on UZH ETH PoS (chain 70207).
const DEFAULT_ASSETS: OnChainAsset[] = [
  {
    address: '0xd5ed0b485b532866ad75f24488811830ed70c55a',
    name: 'Solar Plant Alpha',
    symbol: 'SPA',
  },
  {
    address: '0x0000000000000000000000000000000000000001',
    name: 'Wind Farm Zurich',
    symbol: 'WFZ',
  },
  {
    address: '0x0000000000000000000000000000000000000002',
    name: 'EV Charging Grid',
    symbol: 'ECG',
  },
];

export function useDeployedAssets() {
  const { data: deployedAssets, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.RWAFactory as `0x${string}`,
    abi: RWAFactory_ABI,
    functionName: 'getAllAssetsData',
    query: { refetchInterval: 5000 },
  });

  const assets: OnChainAsset[] = useMemo(() => {
    // Start with the hardcoded defaults
    const combined = [...DEFAULT_ASSETS];

    // Merge on-chain assets from the factory contract
    if (deployedAssets) {
      const onChain = (deployedAssets as unknown as {
        tokenAddress: string;
        name: string;
        symbol: string;
        governorAddress: string;
        poolAddress: string;
      }[]).map((asset) => ({
        address: asset.tokenAddress,
        name: asset.name,
        symbol: asset.symbol,
        governorAddress: asset.governorAddress,
        poolAddress: asset.poolAddress,
      }));

      for (const oc of onChain) {
        const existingIdx = combined.findIndex(
          (a) => a.address.toLowerCase() === oc.address.toLowerCase()
        );
        if (existingIdx >= 0) {
          // On-chain data is authoritative — replace the hardcoded entry
          combined[existingIdx] = oc;
        } else {
          // Brand new asset created during the demo — add it
          combined.push(oc);
        }
      }
    }

    return combined;
  }, [deployedAssets]);

  return {
    assets,
    isLoading,
    error,
    refetch,
  };
}
